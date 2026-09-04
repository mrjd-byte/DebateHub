import { state } from "./state.js";

export function renderHome() {
    return `
        <h1>Welcome to Debate Platform</h1>
        <p>Explore debates and different perspectives.</p>
    `;
}

export function renderLogin() {
    return `
        <h1>Login</h1>

        <form id="login-form">

            <label>
                Email
                <input type="email" id="login-email">
            </label>

            <label>
                Phone
                <input type="tel" id="login-phone">
            </label>

            <label>
                Password
                <input type="password" id="login-password">
            </label>

            <button type="submit">Login</button>

            <p id="login-message"></p>

        </form>
    `;
}

export function renderProfile() {
    return `
        <h1>Profile</h1>
        <p>Profile page coming soon.</p>
    `;
}

export function renderSearch() {
    return `
        <h1>Search</h1>
        <p>Search page coming soon.</p>
    `;
}

export function renderRegister() {
    return `
        <h1>Create Account</h1>

        <form id="register-form">

            <label>
                Email
                <input type="email" id="email">
            </label>

            <label>
                Phone
                <input type="tel" id="phone">
            </label>

            <label>
                Password
                <input type="password" id="password">
            </label>

            <button type="submit">Register</button>

            <p id="register-message"></p>

        </form>
    `;
}

export function renderCreateDebate() {
    return `
        <h1>Create Debate</h1>

        <form id="create-debate-form">

            <label>
                Title
                <input type="text" id="debate-title">
            </label>

            <label>
                Description
                <textarea id="debate-description"></textarea>
            </label>

            <label>
                Topic
                <input type="text" id="debate-topic">
            </label>

            <label>
                Tags
                <input
                    type="text"
                    id="debate-tags"
                    placeholder="AI, Technology, Jobs"
                >
            </label>

            <button type="submit">Create Debate</button>

            <p id="debate-message"></p>

        </form>
    `;
}

export function renderDebate(debateId) {

    const debate = state.appData.debates.find(
        debate => debate.id === debateId
    );

    if (!debate) {
        return `
            <h1>Debate Not Found</h1>
            <p>The debate you're looking for does not exist.</p>
        `;
    }

    return `
        <article>
            <h1>${debate.title}</h1>

            <p>${debate.description}</p>

            <p>
                <strong>Topic:</strong>
                ${debate.topic}
            </p>

            <div>
                <strong>Tags:</strong>
                ${debate.tags.map(tag => `<span>${tag}</span>`).join(" ")}
            </div>
        </article>
    `;
}

export function renderNotFound() {
    return `
        <h1>404</h1>
        <p>Page not found.</p>
    `;
}

export function renderNavbar() { //MAKING NAVBAR DYNAMIC DIFFERENT FOR LOGIN AND REGISTER

    if (state.auth.isAuthenticated) {
        return `
            <a href="/" data-link>Home</a>
            <a href="/create" data-link>new debate</a>
            <a href="/profile" data-link>Profile</a>
            <button id="logout-button">Logout</button>
        `;
    }

    return `
        <a href="/" data-link>Home</a>
        <a href="/search" data-link>Search</a>
        <a href="/login" data-link>Login</a>
        <a href="/register" data-link>Register</a>
    `;
}
// router.js
//     ↓
// "Which view?"
//     ↓
// ui.js
//     ↓
// "How should that view look?"
//     ↓
// DOM