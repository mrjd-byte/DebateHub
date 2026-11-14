import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";
import { auth, db } from "./firebase.js";
import { state } from "./state.js";
import { saveState } from "./storage.js";
import { fetchResponsesForArgument } from "./responses.js";
import { fetchPositionsForDebate } from "./positions.js";
import { fetchVotesForArgument } from "./votes.js";

function normalizeArgument(id, data, parentDebateId) {
    let createdAt = data.createdAt;
    if (createdAt && typeof createdAt.toDate === "function") {
        createdAt = createdAt.toDate().toISOString();
    } else if (createdAt instanceof Date) {
        createdAt = createdAt.toISOString();
    } else if (typeof createdAt !== "string") {
        createdAt = new Date().toISOString();
    }

    let updatedAt = data.updatedAt;
    if (updatedAt && typeof updatedAt.toDate === "function") {
        updatedAt = updatedAt.toDate().toISOString();
    } else if (updatedAt instanceof Date) {
        updatedAt = updatedAt.toISOString();
    } else if (typeof updatedAt !== "string") {
        updatedAt = createdAt;
    }

    return {
        id,
        content: data.content || "",
        authorId: data.authorId || "",
        debateId: data.debateId || parentDebateId,
        side: data.side || "support",
        createdAt,
        updatedAt
    };
}

export async function fetchArguments(debateId) {
    if (!debateId) {
        return { success: false, message: "Debate ID is required." };
    }

    state.argumentsLoading = true;
    try {
        const argsCollection = collection(db, "debates", debateId, "arguments");
        const snapshot = await getDocs(argsCollection);

        const firestoreArguments = [];
        snapshot.forEach(docSnap => {
            firestoreArguments.push(normalizeArgument(docSnap.id, docSnap.data(), debateId));
        });

        // Sort ascending by creation date so arguments display in order
        firestoreArguments.sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime() || 0;
            const timeB = new Date(b.createdAt).getTime() || 0;
            return timeA - timeB;
        });

        // Keep arguments from other debates
        const otherArguments = (state.appData.arguments || []).filter(
            arg => arg.debateId !== debateId
        );

        // Keep local-only arguments for this debate that aren't in Firestore
        const firestoreIds = new Set(firestoreArguments.map(a => a.id));
        const localOnlyArgs = (state.appData.arguments || []).filter(
            arg => arg.debateId === debateId && !firestoreIds.has(arg.id)
        );

        state.appData.arguments = [...otherArguments, ...firestoreArguments, ...localOnlyArgs];
        state.argumentsLoading = false;

        // Fetch debate positions in parallel
        try {
            await fetchPositionsForDebate(debateId).catch(posErr => {
                console.warn("Could not load positions for debate:", debateId, posErr);
            });
        } catch (posErr) {
            console.warn("Error fetching positions:", posErr);
        }

        // Fetch votes and nested responses for all arguments in parallel
        try {
            const childPromises = firestoreArguments.map(async arg => {
                const argVotePromise = fetchVotesForArgument(debateId, arg.id).catch(err => {
                    console.warn("Could not load votes for argument:", arg.id, err);
                });
                const respPromise = fetchResponsesForArgument(debateId, arg.id).catch(err => {
                    console.warn("Could not load responses for argument:", arg.id, err);
                });
                await Promise.all([argVotePromise, respPromise]);
            });
            await Promise.all(childPromises);
        } catch (respErr) {
            console.warn("Error fetching child data for debate arguments:", respErr);
        }

        return {
            success: true,
            arguments: firestoreArguments
        };
    } catch (error) {
        console.error("Error fetching arguments from Firestore:", error);
        state.argumentsLoading = false;
        return {
            success: false,
            message: error.code === "permission-denied"
                ? "Permission denied. Check Firestore security rules."
                : (error.message || "Failed to load arguments.")
        };
    }
}

export async function createArgument({ debateId, side, content }) {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        return {
            success: false,
            message: "You must be logged in to submit an argument."
        };
    }

    const currentUserId = currentUser.uid;

    const normalizedContent = content?.trim();
    if (!normalizedContent) {
        return {
            success: false,
            message: "Argument cannot be empty."
        };
    }

    const validSides = ["support", "oppose"];
    if (!validSides.includes(side)) {
        return {
            success: false,
            message: "Invalid argument side."
        };
    }

    try {
        // Verify parent debate exists in Firestore
        const debateRef = doc(db, "debates", debateId);
        const debateSnap = await getDoc(debateRef);

        if (!debateSnap.exists()) {
            return {
                success: false,
                message: "This debate only exists locally or was not found in Firestore. Please create or choose a Firestore debate to add arguments."
            };
        }

        const argsCollection = collection(db, "debates", debateId, "arguments");
        const newArgRef = doc(argsCollection);
        const argumentId = newArgRef.id;

        const firestoreData = {
            content: normalizedContent,
            authorId: currentUserId,
            debateId,
            side,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        await setDoc(newArgRef, firestoreData);

        const argument = {
            id: argumentId,
            content: normalizedContent,
            authorId: currentUserId,
            debateId,
            side,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        state.appData.arguments.push(argument);

        return {
            success: true,
            argument
        };
    } catch (error) {
        console.error("Error creating argument in Firestore:", error);
        return {
            success: false,
            message: error.code === "permission-denied"
                ? "Permission denied. Check Firestore security rules."
                : (error.message || "Failed to submit argument.")
        };
    }
}

export async function updateArgument(argumentId, { content, side }) {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        return {
            success: false,
            message: "You must be logged in to update an argument."
        };
    }

    const currentUserId = currentUser.uid;

    const argument = state.appData.arguments.find(
        arg => arg.id === argumentId
    );

    if (!argument) {
        return {
            success: false,
            message: "Argument not found."
        };
    }

    if (argument.authorId !== currentUserId) {
        return {
            success: false,
            message: "You can only update your own argument."
        };
    }

    const normalizedContent = content?.trim();
    if (!normalizedContent) {
        return {
            success: false,
            message: "Argument cannot be empty."
        };
    }

    const validSides = ["support", "oppose"];
    if (!validSides.includes(side)) {
        return {
            success: false,
            message: "Invalid argument side."
        };
    }

    try {
        const argRef = doc(db, "debates", argument.debateId, "arguments", argumentId);
        await updateDoc(argRef, {
            content: normalizedContent,
            side,
            updatedAt: serverTimestamp()
        });

        // Update local object
        argument.content = normalizedContent;
        argument.side = side;
        argument.updatedAt = new Date().toISOString();

        return {
            success: true,
            argument
        };
    } catch (error) {
        console.error("Error updating argument in Firestore:", error);
        return {
            success: false,
            message: error.code === "permission-denied"
                ? "Permission denied. Only the author can update this argument."
                : (error.message || "Failed to update argument.")
        };
    }
}

export async function deleteArgument(argumentId, debateId) {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        return {
            success: false,
            message: "You must be logged in to delete an argument."
        };
    }

    const currentUserId = currentUser.uid;

    const argument = state.appData.arguments.find(
        arg => arg.id === argumentId
    );

    if (!argument) {
        return {
            success: false,
            message: "Argument not found."
        };
    }

    if (argument.authorId !== currentUserId) {
        return {
            success: false,
            message: "You can only delete your own argument."
        };
    }

    const targetDebateId = debateId || argument.debateId;

    try {
        // Clean up child votes on this argument in Firestore
        try {
            const argVotesCol = collection(db, "debates", targetDebateId, "arguments", argumentId, "votes");
            const argVotesSnap = await getDocs(argVotesCol);
            const delVotePromises = [];
            argVotesSnap.forEach(vDoc => {
                delVotePromises.push(deleteDoc(vDoc.ref).catch(err => {
                    console.warn("Could not delete argument vote:", err);
                }));
            });
            await Promise.all(delVotePromises);
        } catch (cleanupErr) {
            console.warn("Argument votes cleanup warning:", cleanupErr);
        }

        // Clean up child responses in Firestore subcollection
        try {
            const respCol = collection(db, "debates", targetDebateId, "arguments", argumentId, "responses");
            const respSnap = await getDocs(respCol);
            const delRespPromises = [];
            respSnap.forEach(rDoc => {
                delRespPromises.push(deleteDoc(rDoc.ref).catch(err => {
                    console.warn("Could not delete child response:", err);
                }));
            });
            await Promise.all(delRespPromises);
        } catch (cleanupErr) {
            console.warn("Child response cleanup warning:", cleanupErr);
        }

        const argRef = doc(db, "debates", targetDebateId, "arguments", argumentId);
        await deleteDoc(argRef);

        // Remove from local in-memory state
        state.appData.arguments = state.appData.arguments.filter(
            arg => arg.id !== argumentId
        );

        // Remove child responses and votes related to this argument
        const responseIds = state.appData.responses
            .filter(r => r.argumentId === argumentId)
            .map(r => r.id);

        state.appData.responses = state.appData.responses.filter(
            r => r.argumentId !== argumentId
        );

        state.appData.votes = state.appData.votes.filter(
            v => v.argumentId !== argumentId && !responseIds.includes(v.responseId)
        );

        saveState();

        return {
            success: true
        };
    } catch (error) {
        console.error("Error deleting argument from Firestore:", error);
        return {
            success: false,
            message: error.code === "permission-denied"
                ? "Permission denied. Only the author can delete this argument."
                : (error.message || "Failed to delete argument.")
        };
    }
}
