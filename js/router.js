import { state } from "./state.js";

import {
    renderHome,
    renderLogin,
    renderProfile,
    renderSearch,
    renderRegister,
    renderCreateDebate,
    renderDebate,
    renderNotFound
} from "./ui.js";

function requireAuth(view) {
    if (!state.auth.isAuthenticated) {
        return renderLogin();
    }

    return view();
}

export function router() {
    const path = window.location.pathname;

    if (path === "/") {
        return renderHome();

    } else if (path === "/login") {
        return renderLogin();

    } else if (path === "/profile") {
        return requireAuth(renderProfile);

    } else if (path === "/search") {
        return renderSearch();

    } else if (path === "/register") {
        return renderRegister();

    } else if (path === "/create") {
        return requireAuth(renderCreateDebate);

    } else if (path.startsWith("/debate/")) {

        const parts = path.split("/");
        const debateId = parts[2];

        return renderDebate(debateId);

    } else {
        return renderNotFound();
    }
}
//we dont know the debateid like /debate/101 beforehand so we keep it => /debate/ :id id is dynamic data
//If i dont use export it becomes a private function
// This file checks the current URL and injects the matching HTML into the #app div.
// previously
// router()
//    ↓
// directly changes DOM

// Now
// router()
//    ↓
// returns HTML