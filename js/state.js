export const state = {

    auth: {
        isAuthenticated: false,
        currentUser: null
    },

    navigation: {
        currentView: "home",
        currentDebateId: null
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
