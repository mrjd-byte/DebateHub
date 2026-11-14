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

function normalizePosition(userId, data, parentDebateId) {
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
        userId: data.userId || userId,
        debateId: data.debateId || parentDebateId,
        value: data.value,
        createdAt,
        updatedAt
    };
}

export async function fetchPositionsForDebate(debateId) {
    if (!debateId) {
        return { success: false, message: "Debate ID is required." };
    }

    try {
        const posCollection = collection(db, "debates", debateId, "positions");
        const snapshot = await getDocs(posCollection);

        const firestorePositions = [];
        snapshot.forEach(docSnap => {
            firestorePositions.push(normalizePosition(docSnap.id, docSnap.data(), debateId));
        });

        // Filter out existing positions for this debate, keeping others
        const otherPositions = (state.appData.positions || []).filter(
            p => p.debateId !== debateId
        );

        // Keep local-only positions that aren't in Firestore
        const firestoreUserIds = new Set(firestorePositions.map(p => p.userId));
        const localOnlyPositions = (state.appData.positions || []).filter(
            p => p.debateId === debateId && !firestoreUserIds.has(p.userId)
        );

        state.appData.positions = [...otherPositions, ...firestorePositions, ...localOnlyPositions];
        saveState();

        return {
            success: true,
            positions: firestorePositions
        };
    } catch (error) {
        console.error("Error fetching positions from Firestore:", error);
        return {
            success: false,
            message: error.message || "Failed to fetch positions."
        };
    }
}

export async function setPosition(debateId, value) {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        return {
            success: false,
            message: "You must be logged in to choose a position."
        };
    }

    const validPositions = ["support", "oppose", "undecided"];

    if (!validPositions.includes(value)) {
        return {
            success: false,
            message: "Invalid position."
        };
    }

    const userId = currentUser.uid;
    const posRef = doc(db, "debates", debateId, "positions", userId);

    try {
        const existingPosition = (state.appData.positions || []).find(position =>
            position.userId === userId &&
            position.debateId === debateId
        );

        const docSnap = await getDoc(posRef);

        if (docSnap.exists()) {
            await updateDoc(posRef, {
                value,
                updatedAt: serverTimestamp()
            });
        } else {
            await setDoc(posRef, {
                userId,
                debateId,
                value,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }

        const now = new Date().toISOString();

        if (existingPosition) {
            existingPosition.value = value;
            existingPosition.updatedAt = now;
        } else {
            const position = {
                userId,
                debateId,
                value,
                createdAt: now,
                updatedAt: now
            };
            state.appData.positions.push(position);
        }

        saveState();

        return {
            success: true
        };
    } catch (error) {
        console.error("Error setting position in Firestore:", error);
        return {
            success: false,
            message: error.code === "permission-denied"
                ? "Permission denied. Check your Firestore security rules."
                : (error.message || "Failed to set position.")
        };
    }
}

export function getPositionStats(debateId) {
    const positions = (state.appData.positions || []).filter(
        position => position.debateId === debateId
    );

    const support = positions.filter(
        position => position.value === "support"
    ).length;

    const oppose = positions.filter(
        position => position.value === "oppose"
    ).length;

    const undecided = positions.filter(
        position => position.value === "undecided"
    ).length;

    const total = positions.length;

    const supportPercentage =
        total === 0 ? 0 : Math.round((support / total) * 100);

    const opposePercentage =
        total === 0 ? 0 : Math.round((oppose / total) * 100);

    const undecidedPercentage =
        total === 0 ? 0 : Math.round((undecided / total) * 100);

    return {
        support,
        oppose,
        undecided,
        total,
        supportPercentage,
        opposePercentage,
        undecidedPercentage
    };
}
