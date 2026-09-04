import { state } from "./state.js";
import { saveState } from "./storage.js";

export function setPosition(debateId, value) {

    if (!state.auth.currentUser) {
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

    const existingPosition = state.appData.positions.find(position =>
        position.userId === state.auth.currentUser.id &&
        position.debateId === debateId
    );

    if (existingPosition) {
        existingPosition.value = value;
    } else {
        const position = {
            userId: state.auth.currentUser.id,
            debateId,
            value
        };

        state.appData.positions.push(position);
    }

    saveState();

    return {
        success: true
    };
}

export function getPositionStats(debateId) {

    const positions = state.appData.positions.filter(
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