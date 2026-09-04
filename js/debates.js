import { state } from "./state.js";
import { saveState } from "./storage.js";

export function createDebate({ title, description, topic, tags }) {

    if (!title || !description || !topic) {
        return {
            success: false,
            message: "Title, description and topic are required."
        };
    }

}