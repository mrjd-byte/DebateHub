import { state } from "./state.js";
import { saveState } from "./storage.js";

export function createDebate({ title, description, topic, tags }) {

    if (!title || !description || !topic) {
        return {
            success: false,
            message: "Title, description and topic are required."
        };
    }

    if (!state.auth.currentUser) {
        return {
            success: false,
            message: "You must be logged in to create a debate."
        };
    }

    const debate = {
        id: crypto.randomUUID(),
        title,
        description,
        topic,
        tags,
        authorId: state.auth.currentUser.id,
        createdAt: new Date().toISOString()
    };

    state.appData.debates.push(debate);

    saveState();

    return {
        success: true,
        debate
    };
}