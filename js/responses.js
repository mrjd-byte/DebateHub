import { state } from "./state.js";
import { saveState } from "./storage.js";

export function createResponse({ argumentId, content }) {

    // A response can only be created by a logged-in user
    if (!state.auth.currentUser) {
        return {
            success: false,
            message: "You must be logged in to reply."
        };
    }

    // A response must contain some text
    if (!content) {
        return {
            success: false,
            message: "Response cannot be empty."
        };
    }

    // Make sure the argument being replied to actually exists
    const argument = state.appData.arguments.find(
        argument => argument.id === argumentId
    );

    if (!argument) {
        return {
            success: false,
            message: "Argument not found."
        };
    }

    const response = {
        id: crypto.randomUUID(),
        argumentId,
        authorId: state.auth.currentUser.id,
        content,
        createdAt: new Date().toISOString()
    };

    state.appData.responses.push(response);

    saveState();

    return {
        success: true,
        response
    };
}