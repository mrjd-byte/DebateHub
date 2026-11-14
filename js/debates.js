import {
    collection,
    doc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";
import { auth, db } from "./firebase.js";
import { state } from "./state.js";
import { saveState } from "./storage.js";

function normalizeDebate(id, data) {
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
        title: data.title || "",
        description: data.description || "",
        topic: data.topic || "",
        tags: Array.isArray(data.tags) ? data.tags : [],
        authorId: data.authorId || "",
        createdAt,
        updatedAt
    };
}

export async function fetchDebates() {
    state.debatesLoading = true;
    try {
        const debatesCollection = collection(db, "debates");
        const snapshot = await getDocs(debatesCollection);

        const firestoreDebates = [];
        snapshot.forEach(docSnap => {
            firestoreDebates.push(normalizeDebate(docSnap.id, docSnap.data()));
        });

        // Sort descending by creation date
        firestoreDebates.sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime() || 0;
            const timeB = new Date(b.createdAt).getTime() || 0;
            return timeB - timeA;
        });

        // Preserve any existing local debates that are not in Firestore
        const firestoreIds = new Set(firestoreDebates.map(d => d.id));
        const localOnlyDebates = (state.appData.debates || []).filter(
            d => !firestoreIds.has(d.id)
        );

        state.appData.debates = [...firestoreDebates, ...localOnlyDebates];
        state.debatesLoading = false;

        return {
            success: true,
            debates: state.appData.debates
        };
    } catch (error) {
        console.error("Failed to fetch debates from Firestore:", error);
        state.debatesLoading = false;
        return {
            success: false,
            message: error.code === "permission-denied"
                ? "Permission denied. Check Firestore security rules."
                : (error.message || "Failed to load debates.")
        };
    }
}

export async function createDebate({ title, description, topic, tags }) {
    if (!title || !description || !topic) {
        return {
            success: false,
            message: "Title, description and topic are required."
        };
    }

    const currentUserId = auth.currentUser?.uid || state.auth.currentUser?.id;

    if (!currentUserId) {
        return {
            success: false,
            message: "You must be logged in to create a debate."
        };
    }

    try {
        const debatesCollection = collection(db, "debates");
        const newDebateRef = doc(debatesCollection);
        const debateId = newDebateRef.id;

        const cleanTags = Array.isArray(tags) ? tags : [];

        const firestoreData = {
            title,
            description,
            topic,
            tags: cleanTags,
            authorId: currentUserId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        await setDoc(newDebateRef, firestoreData);

        const debate = {
            id: debateId,
            title,
            description,
            topic,
            tags: cleanTags,
            authorId: currentUserId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        state.appData.debates.unshift(debate);

        return {
            success: true,
            debate
        };
    } catch (error) {
        console.error("Error creating debate in Firestore:", error);
        return {
            success: false,
            message: error.code === "permission-denied"
                ? "Permission denied. Check your Firestore security rules."
                : (error.message || "Failed to create debate.")
        };
    }
}

// UPDATE DEBATE
export async function updateDebate(debateId, { title, description, topic, tags }) {
    const currentUserId = auth.currentUser?.uid || state.auth.currentUser?.id;

    if (!currentUserId) {
        return {
            success: false,
            message: "You must be logged in to update a debate."
        };
    }

    const debate = state.appData.debates.find(
        d => d.id === debateId
    );

    if (!debate) {
        return {
            success: false,
            message: "Debate not found."
        };
    }

    // Only the author can update their debate
    if (debate.authorId !== currentUserId) {
        return {
            success: false,
            message: "You can only update your own debate."
        };
    }

    // Basic validation
    if (!title || !description || !topic) {
        return {
            success: false,
            message: "Title, description and topic are required."
        };
    }

    const cleanTags = Array.isArray(tags) ? tags : [];

    try {
        const debateRef = doc(db, "debates", debateId);
        await updateDoc(debateRef, {
            title,
            description,
            topic,
            tags: cleanTags,
            updatedAt: serverTimestamp()
        });

        // Update the existing object in local state
        debate.title = title;
        debate.description = description;
        debate.topic = topic;
        debate.tags = cleanTags;
        debate.updatedAt = new Date().toISOString();

        return {
            success: true,
            debate
        };
    } catch (error) {
        console.error("Error updating debate in Firestore:", error);
        return {
            success: false,
            message: error.code === "permission-denied"
                ? "Permission denied. Only the author can update this debate."
                : (error.message || "Failed to update debate.")
        };
    }
}

export async function deleteDebate(debateId) {
    const currentUserId = auth.currentUser?.uid || state.auth.currentUser?.id;

    // User must be logged in
    if (!currentUserId) {
        return {
            success: false,
            message: "You must be logged in to delete a debate."
        };
    }

    // Find the debate
    const debate = state.appData.debates.find(
        d => d.id === debateId
    );

    if (!debate) {
        return {
            success: false,
            message: "Debate not found."
        };
    }

    // Only the author can delete the debate
    if (debate.authorId !== currentUserId) {
        return {
            success: false,
            message: "You can only delete your own debate."
        };
    }

    try {
        // Clean up subcollection arguments and responses in Firestore
        try {
            const argsCollection = collection(db, "debates", debateId, "arguments");
            const argsSnapshot = await getDocs(argsCollection);
            const deletePromises = [];
            for (const argDoc of argsSnapshot.docs) {
                try {
                    const respCol = collection(db, "debates", debateId, "arguments", argDoc.id, "responses");
                    const respSnap = await getDocs(respCol);
                    respSnap.forEach(rDoc => {
                        deletePromises.push(deleteDoc(rDoc.ref).catch(err => {
                            console.warn("Could not delete subcollection response:", err.message);
                        }));
                    });
                } catch (e) {
                    // Ignore response query error
                }
                deletePromises.push(deleteDoc(argDoc.ref).catch(err => {
                    console.warn("Could not delete subcollection argument:", err.message);
                }));
            }
            // Clean up positions subcollection
            try {
                const posCol = collection(db, "debates", debateId, "positions");
                const posSnap = await getDocs(posCol);
                posSnap.forEach(pDoc => {
                    deletePromises.push(deleteDoc(pDoc.ref).catch(err => {
                        console.warn("Could not delete subcollection position:", err.message);
                    }));
                });
            } catch (posErr) {
                // Ignore positions cleanup error
            }

            await Promise.all(deletePromises);
        } catch (cleanupError) {
            console.warn("Subcollection cleanup warning:", cleanupError.message);
        }

        const debateRef = doc(db, "debates", debateId);
        await deleteDoc(debateRef);

        // Find all arguments belonging to this debate
        const debateArguments = state.appData.arguments.filter(
            argument => argument.debateId === debateId
        );

        // Get their IDs so we can remove related responses and votes
        const argumentIds = debateArguments.map(
            argument => argument.id
        );

        // Find responses belonging to those arguments
        const responseIds = state.appData.responses
            .filter(response => argumentIds.includes(response.argumentId))
            .map(response => response.id);

        // Remove the debate
        state.appData.debates = state.appData.debates.filter(
            d => d.id !== debateId
        );

        // Remove its arguments
        state.appData.arguments = state.appData.arguments.filter(
            argument => argument.debateId !== debateId
        );

        // Remove responses belonging to those arguments
        state.appData.responses = state.appData.responses.filter(
            response => !argumentIds.includes(response.argumentId)
        );

        // Remove votes belonging to deleted arguments/responses
        state.appData.votes = state.appData.votes.filter(
            vote =>
                !argumentIds.includes(vote.argumentId) &&
                !responseIds.includes(vote.responseId)
        );

        // Remove users' positions on this debate
        state.appData.positions = state.appData.positions.filter(
            position => position.debateId !== debateId
        );

        saveState();

        return {
            success: true
        };
    } catch (error) {
        console.error("Error deleting debate from Firestore:", error);
        return {
            success: false,
            message: error.code === "permission-denied"
                ? "Permission denied. Only the author can delete this debate."
                : (error.message || "Failed to delete debate.")
        };
    }
}
