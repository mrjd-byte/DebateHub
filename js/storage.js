import { state } from "./state.js";

const STORAGE_KEY = "debateHubState";

export function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
        Object.assign(state, JSON.parse(saved));
    }
}

//LocalStorage save data as string