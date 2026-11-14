import { state } from "./state.js";

const STORAGE_KEY = "debateHubState";

export function saveState() {
    const { auth, ...applicationState } = state;
    const persistedState = {
        ...applicationState,
        appData: {
            ...state.appData,
            users: state.appData.users.map(({ password, ...user }) => user)
        }
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));
}

export function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return;

    try {
        const savedState = JSON.parse(saved);
        Object.assign(state, savedState);

        // Authentication is restored only by Firebase. Remove credentials
        // from legacy local accounts before writing the sanitized state back.
        state.auth = {
            status: "loading",
            isAuthenticated: false,
            currentUser: null,
            error: null
        };
        state.debatesLoading = true;
        state.appData.users = (state.appData.users || []).map(
            ({ password, ...user }) => user
        );

        // Editing is temporary UI state.
        // Never restore edit mode after reloading the application.
        state.navigation.editingDebateId = null;
        state.navigation.editingArgumentId = null;

        saveState();

    } catch (error) {
        console.error("Failed to load saved state:", error);
    }
}

//LocalStorage save data as string
