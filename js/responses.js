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

function normalizeResponse(id, data, parentDebateId, parentArgumentId) {
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
        argumentId: data.argumentId || parentArgumentId,
        debateId: data.debateId || parentDebateId,
        createdAt,
        updatedAt
    };
}

export async function fetchResponsesForArgument(debateId, argumentId) {
    if (!debateId || !argumentId) {
        return { success: false, message: "Debate ID and Argument ID are required." };
    }

    state.responsesLoading = true;
    try {
        const respCollection = collection(db, "debates", debateId, "arguments", argumentId, "responses");
        const snapshot = await getDocs(respCollection);

        const firestoreResponses = [];
        snapshot.forEach(docSnap => {
            firestoreResponses.push(normalizeResponse(docSnap.id, docSnap.data(), debateId, argumentId));
        });

        // Sort ascending by creation date
        firestoreResponses.sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime() || 0;
            const timeB = new Date(b.createdAt).getTime() || 0;
            return timeA - timeB;
        });

        // Keep responses belonging to other arguments
        const otherResponses = (state.appData.responses || []).filter(
            r => r.argumentId !== argumentId
        );

        // Keep local-only responses for this argument that are not in Firestore
        const firestoreIds = new Set(firestoreResponses.map(r => r.id));
        const localOnlyResponses = (state.appData.responses || []).filter(
            r => r.argumentId === argumentId && !firestoreIds.has(r.id)
        );

        state.appData.responses = [...otherResponses, ...firestoreResponses, ...localOnlyResponses];
        state.responsesLoading = false;

        return {
            success: true,
            responses: firestoreResponses
        };
    } catch (error) {
        console.error("Error fetching responses from Firestore:", error);
        state.responsesLoading = false;
        return {
            success: false,
            message: error.code === "permission-denied"
                ? "Permission denied. Check Firestore security rules."
                : (error.message || "Failed to load replies.")
        };
    }
}

export async function createResponse({ debateId, argumentId, content }) {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        return {
            success: false,
            message: "You must be logged in to reply."
        };
    }

    const normalizedContent = content?.trim();
    if (!normalizedContent) {
        return {
            success: false,
            message: "Response cannot be empty."
        };
    }

    // Resolve parent debateId if not passed directly
    let targetDebateId = debateId;
    if (!targetDebateId) {
        const argument = state.appData.arguments.find(a => a.id === argumentId);
        targetDebateId = argument?.debateId || window.location.pathname.split("/")[2];
    }

    if (!targetDebateId) {
        return {
            success: false,
            message: "Parent debate not found."
        };
    }

    try {
        // Verify parent argument exists in Firestore
        const argRef = doc(db, "debates", targetDebateId, "arguments", argumentId);
        const argSnap = await getDoc(argRef);

        if (!argSnap.exists()) {
            return {
                success: false,
                message: "This argument does not exist in Firestore. Replies can only be added to Firestore arguments."
            };
        }

        const responsesCollection = collection(db, "debates", targetDebateId, "arguments", argumentId, "responses");
        const newResponseRef = doc(responsesCollection);
        const responseId = newResponseRef.id;

        const firestoreData = {
            content: normalizedContent,
            authorId: currentUser.uid,
            debateId: targetDebateId,
            argumentId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        await setDoc(newResponseRef, firestoreData);

        const response = {
            id: responseId,
            content: normalizedContent,
            authorId: currentUser.uid,
            debateId: targetDebateId,
            argumentId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        state.appData.responses.push(response);

        return {
            success: true,
            response
        };
    } catch (error) {
        console.error("Error creating response in Firestore:", error);
        return {
            success: false,
            message: error.code === "permission-denied"
                ? "Permission denied. Check Firestore security rules."
                : (error.message || "Failed to post reply.")
        };
    }
}

export async function updateResponse(responseId, { debateId, argumentId, content }) {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        return {
            success: false,
            message: "You must be logged in to update a reply."
        };
    }

    const response = state.appData.responses.find(r => r.id === responseId);
    if (!response) {
        return {
            success: false,
            message: "Response not found."
        };
    }

    if (response.authorId !== currentUser.uid) {
        return {
            success: false,
            message: "You can only update your own reply."
        };
    }

    const normalizedContent = content?.trim();
    if (!normalizedContent) {
        return {
            success: false,
            message: "Response cannot be empty."
        };
    }

    const targetArgumentId = argumentId || response.argumentId;
    let targetDebateId = debateId || response.debateId;
    if (!targetDebateId) {
        const arg = state.appData.arguments.find(a => a.id === targetArgumentId);
        targetDebateId = arg?.debateId || window.location.pathname.split("/")[2];
    }

    try {
        const respRef = doc(db, "debates", targetDebateId, "arguments", targetArgumentId, "responses", responseId);
        await updateDoc(respRef, {
            content: normalizedContent,
            updatedAt: serverTimestamp()
        });

        response.content = normalizedContent;
        response.updatedAt = new Date().toISOString();

        return {
            success: true,
            response
        };
    } catch (error) {
        console.error("Error updating response in Firestore:", error);
        return {
            success: false,
            message: error.code === "permission-denied"
                ? "Permission denied. Only the author can update this reply."
                : (error.message || "Failed to update reply.")
        };
    }
}

export async function deleteResponse(responseId, { debateId, argumentId } = {}) {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        return {
            success: false,
            message: "You must be logged in to delete a reply."
        };
    }

    const response = state.appData.responses.find(r => r.id === responseId);
    if (!response) {
        return {
            success: false,
            message: "Response not found."
        };
    }

    if (response.authorId !== currentUser.uid) {
        return {
            success: false,
            message: "You can only delete your own reply."
        };
    }

    const targetArgumentId = argumentId || response.argumentId;
    let targetDebateId = debateId || response.debateId;
    if (!targetDebateId) {
        const arg = state.appData.arguments.find(a => a.id === targetArgumentId);
        targetDebateId = arg?.debateId || window.location.pathname.split("/")[2];
    }

    try {
        const respRef = doc(db, "debates", targetDebateId, "arguments", targetArgumentId, "responses", responseId);
        await deleteDoc(respRef);

        state.appData.responses = state.appData.responses.filter(r => r.id !== responseId);

        // Remove votes associated with this response
        state.appData.votes = state.appData.votes.filter(v => v.responseId !== responseId);

        saveState();

        return {
            success: true
        };
    } catch (error) {
        console.error("Error deleting response from Firestore:", error);
        return {
            success: false,
            message: error.code === "permission-denied"
                ? "Permission denied. Only the author can delete this reply."
                : (error.message || "Failed to delete reply.")
        };
    }
}
