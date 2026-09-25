import { state } from "./state.js";

const STORAGE_KEY = "debateHubState";

export function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return;

    try {
        Object.assign(state, JSON.parse(saved));

        // Editing is temporary UI state.
        // Never restore edit mode after reloading the application.
        state.navigation.editingDebateId = null;
        state.navigation.editingArgumentId = null;

    } catch (error) {
        console.error("Failed to load saved state:", error);
    }
}

//LocalStorage save data as string