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

export async function fetchVotesForArgument(debateId, argumentId) {
    if (!debateId || !argumentId) {
        return { success: false, message: "Debate ID and Argument ID are required." };
    }

    try {
        const votesCol = collection(db, "debates", debateId, "arguments", argumentId, "votes");
        const snapshot = await getDocs(votesCol);

        const firestoreVotes = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            firestoreVotes.push({
                id: docSnap.id,
                userId: data.userId || docSnap.id,
                argumentId: data.argumentId || argumentId,
                debateId: data.debateId || debateId,
                value: data.value
            });
        });

        const otherVotes = (state.appData.votes || []).filter(
            v => v.argumentId !== argumentId
        );

        const firestoreUserIds = new Set(firestoreVotes.map(v => v.userId));
        const localOnlyVotes = (state.appData.votes || []).filter(
            v => v.argumentId === argumentId && !firestoreUserIds.has(v.userId)
        );

        state.appData.votes = [...otherVotes, ...firestoreVotes, ...localOnlyVotes];
        saveState();

        return {
            success: true,
            votes: firestoreVotes
        };
    } catch (error) {
        console.error("Error fetching votes for argument:", error);
        return {
            success: false,
            message: error.message || "Failed to fetch votes for argument."
        };
    }
}

export async function fetchVotesForResponse(debateId, argumentId, responseId) {
    if (!debateId || !argumentId || !responseId) {
        return { success: false, message: "Debate ID, Argument ID, and Response ID are required." };
    }

    try {
        const votesCol = collection(db, "debates", debateId, "arguments", argumentId, "responses", responseId, "votes");
        const snapshot = await getDocs(votesCol);

        const firestoreVotes = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            firestoreVotes.push({
                id: docSnap.id,
                userId: data.userId || docSnap.id,
                responseId: data.responseId || responseId,
                argumentId: data.argumentId || argumentId,
                debateId: data.debateId || debateId,
                value: data.value
            });
        });

        const otherVotes = (state.appData.votes || []).filter(
            v => v.responseId !== responseId
        );

        const firestoreUserIds = new Set(firestoreVotes.map(v => v.userId));
        const localOnlyVotes = (state.appData.votes || []).filter(
            v => v.responseId === responseId && !firestoreUserIds.has(v.userId)
        );

        state.appData.votes = [...otherVotes, ...firestoreVotes, ...localOnlyVotes];
        saveState();

        return {
            success: true,
            votes: firestoreVotes
        };
    } catch (error) {
        console.error("Error fetching votes for response:", error);
        return {
            success: false,
            message: error.message || "Failed to fetch votes for response."
        };
    }
}

export async function voteOnArgument(argumentId, value) {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        return {
            success: false,
            message: "You must be logged in to vote."
        };
    }

    const validVotes = ["up", "down"];

    if (!validVotes.includes(value)) {
        return {
            success: false,
            message: "Invalid vote."
        };
    }

    const argument = (state.appData.arguments || []).find(
        arg => arg.id === argumentId
    );

    if (!argument) {
        return {
            success: false,
            message: "Argument not found."
        };
    }

    const debateId = argument.debateId;
    if (!debateId) {
        return {
            success: false,
            message: "Parent debate ID not found."
        };
    }

    const userId = currentUser.uid;
    const voteRef = doc(db, "debates", debateId, "arguments", argumentId, "votes", userId);

    try {
        const existingVote = (state.appData.votes || []).find(v =>
            v.userId === userId &&
            v.argumentId === argumentId
        );

        const docSnap = await getDoc(voteRef);

        if (docSnap.exists()) {
            const currentDocValue = docSnap.data().value;

            if (currentDocValue === value) {
                // Clicking the same vote button removes / toggles off the vote
                await deleteDoc(voteRef);

                state.appData.votes = (state.appData.votes || []).filter(
                    v => !(v.userId === userId && v.argumentId === argumentId)
                );
            } else {
                // User changed their vote between up and down
                await updateDoc(voteRef, {
                    value,
                    updatedAt: serverTimestamp()
                });

                if (existingVote) {
                    existingVote.value = value;
                } else {
                    state.appData.votes.push({
                        userId,
                        argumentId,
                        debateId,
                        value
                    });
                }
            }
        } else {
            // First time voting on this argument
            await setDoc(voteRef, {
                userId,
                debateId,
                argumentId,
                value,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            if (existingVote) {
                existingVote.value = value;
            } else {
                state.appData.votes.push({
                    userId,
                    argumentId,
                    debateId,
                    value
                });
            }
        }

        saveState();

        return {
            success: true
        };
    } catch (error) {
        console.error("Error voting on argument in Firestore:", error);
        return {
            success: false,
            message: error.code === "permission-denied"
                ? "Permission denied. Check your Firestore security rules."
                : (error.message || "Failed to submit vote.")
        };
    }
}

export function getArgumentVoteStats(argumentId) {
    const argumentVotes = (state.appData.votes || []).filter(
        vote => vote.argumentId === argumentId
    );

    const upvotes = argumentVotes.filter(
        vote => vote.value === "up"
    ).length;

    const downvotes = argumentVotes.filter(
        vote => vote.value === "down"
    ).length;

    return {
        upvotes,
        downvotes
    };
}

export async function voteOnResponse(responseId, value) {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        return {
            success: false,
            message: "You must be logged in to vote."
        };
    }

    const validVotes = ["up", "down"];

    if (!validVotes.includes(value)) {
        return {
            success: false,
            message: "Invalid vote."
        };
    }

    const response = (state.appData.responses || []).find(
        resp => resp.id === responseId
    );

    if (!response) {
        return {
            success: false,
            message: "Response not found."
        };
    }

    const argumentId = response.argumentId;
    const parentArgument = (state.appData.arguments || []).find(a => a.id === argumentId);
    const debateId = response.debateId || parentArgument?.debateId;

    if (!debateId || !argumentId) {
        return {
            success: false,
            message: "Parent debate or argument ID not found."
        };
    }

    const userId = currentUser.uid;
    const voteRef = doc(db, "debates", debateId, "arguments", argumentId, "responses", responseId, "votes", userId);

    try {
        const existingVote = (state.appData.votes || []).find(v =>
            v.userId === userId &&
            v.responseId === responseId
        );

        const docSnap = await getDoc(voteRef);

        if (docSnap.exists()) {
            const currentDocValue = docSnap.data().value;

            if (currentDocValue === value) {
                // Clicking the same vote button removes / toggles off the vote
                await deleteDoc(voteRef);

                state.appData.votes = (state.appData.votes || []).filter(
                    v => !(v.userId === userId && v.responseId === responseId)
                );
            } else {
                // User changed their vote
                await updateDoc(voteRef, {
                    value,
                    updatedAt: serverTimestamp()
                });

                if (existingVote) {
                    existingVote.value = value;
                } else {
                    state.appData.votes.push({
                        userId,
                        responseId,
                        argumentId,
                        debateId,
                        value
                    });
                }
            }
        } else {
            // First time voting on this response
            await setDoc(voteRef, {
                userId,
                debateId,
                argumentId,
                responseId,
                value,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            if (existingVote) {
                existingVote.value = value;
            } else {
                state.appData.votes.push({
                    userId,
                    responseId,
                    argumentId,
                    debateId,
                    value
                });
            }
        }

        saveState();

        return {
            success: true
        };
    } catch (error) {
        console.error("Error voting on response in Firestore:", error);
        return {
            success: false,
            message: error.code === "permission-denied"
                ? "Permission denied. Check your Firestore security rules."
                : (error.message || "Failed to submit vote.")
        };
    }
}

export function getResponseVoteStats(responseId) {
    const responseVotes = (state.appData.votes || []).filter(
        vote => vote.responseId === responseId
    );

    const upvotes = responseVotes.filter(
        vote => vote.value === "up"
    ).length;

    const downvotes = responseVotes.filter(
        vote => vote.value === "down"
    ).length;

    return {
        upvotes,
        downvotes
    };
}
