export function renderHome() {
    return `
        <h1>Welcome to Debate Platform</h1>
        <p>Explore debates and different perspectives.</p>
    `;
}

export function renderLogin() {
    return `
        <h1>Login</h1>
        <p>Login page coming soon.</p>
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
        <p>Create debate page coming soon.</p>
    `;
}

export function renderDebate(debateId) {
    return `
        <h1>Debate Details</h1>
        <p>Debate ID: ${debateId}</p>
    `;
}

export function renderNotFound() {
    return `
        <h1>404</h1>
        <p>Page not found.</p>
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