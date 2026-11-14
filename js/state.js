export const state = {

    debatesLoading: true,

    auth: {
        status: "loading",
        isAuthenticated: false,
        currentUser: null,
        error: null
    },

    navigation: {
    currentView: "home",
    currentDebateId: null,
    editingDebateId: null,
    editingArgumentId: null
    },

    appData: {
        users: [],
        debates: [],
        arguments: [],
        responses: [],
        positions: [],
        votes: [],
        reactions: [],
        saves: [],
        reports: []
    },

    search: {
        query: "",
        filter: "latest"
    }

};
