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

export function updateArgument(argumentId, { content, side }) {

    // User must be logged in
    if (!state.auth.currentUser) {
        return {
            success: false,
            message: "You must be logged in to update an argument."
        };
    }

    // Find the argument
    const argument = state.appData.arguments.find(
        argument => argument.id === argumentId
    );

    if (!argument) {
        return {
            success: false,
            message: "Argument not found."
        };
    }

    // Only the author can update their argument
    if (argument.authorId !== state.auth.currentUser.id) {
        return {
            success: false,
            message: "You can only update your own argument."
        };
    }

    // Validate content
    if (!content) {
        return {
            success: false,
            message: "Argument cannot be empty."
        };
    }

    // Validate side
    const validSides = ["support", "oppose"];

    if (!validSides.includes(side)) {
        return {
            success: false,
            message: "Invalid argument side."
        };
    }

    // Update the existing argument
    argument.content = content;
    argument.side = side;

    saveState();

    return {
        success: true,
        argument
    };
}