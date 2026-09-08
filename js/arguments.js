import { state } from "./state.js";
import { saveState } from "./storage.js";

export function createArgument({ debateId, side, content }) {

    if (!state.auth.currentUser) {
        return {
            success: false,
            message: "You must be logged in to submit an argument."
        };
    }

    if (!content) {
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

    const debate = state.appData.debates.find(
        debate => debate.id === debateId
    );

    if (!debate) {
        return {
            success: false,
            message: "Debate not found."
        };
    }

    const argument = {
        id: crypto.randomUUID(),
        debateId,
        authorId: state.auth.currentUser.id,
        side,
        content,
        createdAt: new Date().toISOString()
    };

    state.appData.arguments.push(argument);

    saveState();

    return {
        success: true,
        argument
    };
}