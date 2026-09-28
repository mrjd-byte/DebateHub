import { state } from "./state.js";
import { getPositionStats } from "./positions.js";
import { getArgumentVoteStats } from "./votes.js";
import { getResponseVoteStats } from "./votes.js";

function escapeHTML(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatTime(createdAt) {
    const diff = Date.now() - new Date(createdAt).getTime();

    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) {
        return "Just now";
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    return `${days}d ago`;
}

function getAuthorName(authorId) {
    const user = state.appData.users.find(
        user => user.id === authorId
    );

    return user?.username || "Unknown User";
}


export function renderHome() {

    const debates = state.appData.debates;

    return `
        <div class="home-hero">
            <h1 class="hero-title">Debate Platform</h1>
            <p class="hero-subtitle">Explore debates and different perspectives.</p>
        </div>

        <section class="debates-section">
            <h2 class="section-title">Available Debates</h2>

            <div class="debates-list">
                ${debates.length === 0
                ? `
                    <div class="empty-state">
                        <p>No debates yet.</p>
                        <span>Be the first to create one!</span>
                    </div>
                `
                : debates.map(debate => `
                    <article class="debate-card">
                        <h3 class="debate-card-title">
                            <a href="/debate/${debate.id}" data-link>
                                ${escapeHTML(debate.title)}
                            </a>
                        </h3>

                        <p class="debate-card-description">${escapeHTML(debate.description)}</p>

                        <div class="debate-card-meta">
                            <span class="topic-pill">Topic: ${escapeHTML(debate.topic)}</span>
                        </div>
                    </article>
                `).join("")
            }
            </div>
        </section>
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
    const user = state.auth.currentUser;
    return `
        <h1>Profile</h1>
        <p>Username: ${escapeHTML(user.username)}</p>
        <p>
            ${user.email
            ? `Email: ${escapeHTML(user.email)}`
            : `Phone: ${escapeHTML(user.phone)}`
        }
        </p>
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
              Username
              <input type="text" id="username">
            </label>

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

function getInitials(username) {
    if (!username) return "?";
    const cleaned = username.trim().replace(/^[@#]/, "");
    const parts = cleaned.split(/[\s_.-]+/);
    if (parts.length >= 1 && parts[0]) {
        return (parts[0][0]).toUpperCase();
    }
    return cleaned.slice(0, 1).toUpperCase();
}

function renderAvatar(username) {
    const initials = getInitials(username);
    return `
        <span class="user-avatar" title="${escapeHTML(username)}">
            ${escapeHTML(initials)}
        </span>
    `;
}

function renderNestedResponse(response, argumentId) {
    const stats = getResponseVoteStats(response.id);
    const authorName = getAuthorName(response.authorId);

    return `
    <div class="nested-response-card">
        <div class="c-response-header">
            ${renderAvatar(authorName)}
            <span class="c-author-name">${escapeHTML(authorName)}</span>
            <span class="c-timestamp">· ${formatTime(response.createdAt)}</span>
        </div>

        <p class="c-response-content">${escapeHTML(response.content)}</p>

        <div class="c-response-footer">
            <details class="reply-details">
                <summary class="c-reply-btn">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 14l-4-4 4-4"/><path d="M5 10h11a4 4 0 1 1 0 8h-1"/></svg>
                    Reply
                </summary>
                <form class="response-form" data-argument-id="${argumentId}">
                    <textarea placeholder="Write a reply..." required></textarea>
                    <button type="submit">Post Reply</button>
                    <p class="response-message"></p>
                </form>
            </details>

            <div class="c-vote-group">
                <button data-vote="up" data-response-id="${response.id}" title="Upvote">
                    👍 ${stats.upvotes}
                </button>
                <button data-vote="down" data-response-id="${response.id}" title="Downvote">
                    👎 ${stats.downvotes}
                </button>
            </div>
        </div>
    </div>
    `;
}

function renderArgumentThread(argument) {
    const votes = getArgumentVoteStats(argument.id);
    const responses = state.appData.responses.filter(r => r.argumentId === argument.id);
    const authorName = getAuthorName(argument.authorId);
    const isEditingArgument = state.navigation.editingArgumentId === argument.id;

    return `
    <div class="c-thread-container">
        <!-- Parent Argument Card -->
        <article class="community-argument-card">
            <div class="c-response-header">
                ${renderAvatar(authorName)}
                <span class="c-author-name">${escapeHTML(authorName)}</span>
                <span class="c-timestamp">· ${formatTime(argument.createdAt)}</span>

                ${state.auth.currentUser && state.auth.currentUser.id === argument.authorId
                    ? `<button type="button" class="btn-subtle" data-edit-argument="${argument.id}">Edit</button>`
                    : ""
                }
            </div>

            ${isEditingArgument
                ? `
                <form class="edit-argument-form" data-argument-id="${argument.id}">
                    <textarea class="edit-argument-content" required>${escapeHTML(argument.content)}</textarea>
                    <select class="edit-argument-side">
                        <option value="support" ${argument.side === "support" ? "selected" : ""}>Support</option>
                        <option value="oppose" ${argument.side === "oppose" ? "selected" : ""}>Oppose</option>
                    </select>
                    <div class="form-actions-row">
                        <button type="submit">Save Changes</button>
                        <button type="button" class="cancel-edit-argument">Cancel</button>
                    </div>
                </form>
                `
                : `
                <p class="c-argument-content">${escapeHTML(argument.content)}</p>
                `
            }

            <div class="c-response-footer">
                <details class="reply-details">
                    <summary class="c-reply-btn">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 14l-4-4 4-4"/><path d="M5 10h11a4 4 0 1 1 0 8h-1"/></svg>
                        Reply
                    </summary>
                    <form class="response-form" data-argument-id="${argument.id}">
                        <textarea placeholder="Write a reply..." required></textarea>
                        <button type="submit">Post Reply</button>
                        <p class="response-message"></p>
                    </form>
                </details>

                <div class="c-vote-group">
                    <button data-vote="up" data-argument-id="${argument.id}" title="Upvote">
                        👍 ${votes.upvotes}
                    </button>
                    <button data-vote="down" data-argument-id="${argument.id}" title="Downvote">
                        👎 ${votes.downvotes}
                    </button>
                </div>
            </div>
        </article>

        <!-- Nested Responses Under Parent Argument -->
        ${responses.length > 0
            ? `
            <div class="replies-nested-thread">
                <div class="replies-heading">
                    Replies
                </div>
                ${responses.map(response => renderNestedResponse(response, argument.id)).join("")}
            </div>
            `
            : ""
        }
    </div>
    `;
}

export function renderDebate(debateId) {
    const debate = state.appData.debates.find(
        (debate) => debate.id === debateId
    );

    const debateArguments = state.appData.arguments.filter(
        (argument) => argument.debateId === debateId
    );

    const supportArguments = debateArguments.filter(
        (argument) => argument.side === "support"
    );

    const opposeArguments = debateArguments.filter(
        (argument) => argument.side === "oppose"
    );

    if (!debate) {
        return `
            <div class="empty-state">
                <h1>Debate Not Found</h1>
                <p>The debate you're looking for does not exist.</p>
                <a href="/" data-link class="btn-primary" style="margin-top: 1rem; display: inline-block;">Back to Home</a>
            </div>
        `;
    }

    const isEditing = state.navigation.editingDebateId === debate.id;
    const stats = getPositionStats(debateId);

    return `
    <div class="debate-room">

        <!-- ==================================================== -->
        <!-- LEFT PANEL (Debate Control Room: Info, Stances, Form) -->
        <!-- ==================================================== -->
        <div class="debate-left-panel">

            <article class="debate-control-card">
                ${isEditing
                    ? `
                    <form id="edit-debate-form">
                        <label>
                            Title
                            <input
                                type="text"
                                id="edit-title"
                                value="${escapeHTML(debate.title)}"
                                required
                            >
                        </label>

                        <label>
                            Description
                            <textarea id="edit-description" required>${escapeHTML(debate.description)}</textarea>
                        </label>

                        <label>
                            Topic
                            <input
                                type="text"
                                id="edit-topic"
                                value="${escapeHTML(debate.topic)}"
                                required
                            >
                        </label>

                        <label>
                            Tags
                            <input
                                type="text"
                                id="edit-tags"
                                value="${escapeHTML(debate.tags.join(", "))}"
                            >
                        </label>

                        <div class="form-actions-row">
                            <button type="submit">Save Changes</button>
                            <button type="button" id="cancel-edit">Cancel</button>
                        </div>
                    </form>
                    `
                    : `
                    <!-- 1. Debate Header -->
                    <h1 class="debate-main-title">${escapeHTML(debate.title)}</h1>

                    <div class="debate-meta-row">
                        <span>By <strong>${escapeHTML(getAuthorName(debate.authorId))}</strong> · ${formatTime(debate.createdAt)}</span>

                        ${state.auth.currentUser && state.auth.currentUser.id === debate.authorId
                            ? `
                            <div class="owner-actions">
                                <button type="button" class="btn-subtle" data-edit-debate="${debate.id}">Edit</button>
                                <button type="button" class="btn-subtle btn-danger-subtle" data-delete-debate="${debate.id}">Delete</button>
                            </div>
                            `
                            : ""
                        }
                    </div>

                    <p class="debate-full-description">${escapeHTML(debate.description)}</p>

                    <div class="debate-topic-tags">
                        <div class="topic-line">
                            <strong>Topic:</strong>
                            <span class="topic-pill">${escapeHTML(debate.topic)}</span>
                        </div>

                        ${debate.tags.length > 0
                            ? `
                            <div class="tags-line">
                                <strong>Tags:</strong>
                                ${debate.tags.map(tag => `<span class="tag-pill">${escapeHTML(tag)}</span>`).join(" ")}
                            </div>
                            `
                            : ""
                        }
                    </div>
                    `
                }

                <!-- 2. Position Section -->
                <div class="debate-position-section">
                    <div class="position-buttons-row">
                        <button
                            class="position-button support-button"
                            data-position="support"
                        >
                            Support
                        </button>

                        <button
                            class="position-button oppose-button"
                            data-position="oppose"
                        >
                            Oppose
                        </button>

                        <button
                            class="position-button undecided-button"
                            data-position="undecided"
                        >
                            Undecided
                        </button>
                    </div>
                </div>

                <!-- 3. Current Positions -->
                <div class="current-positions-box">
                    <h3 class="current-positions-title">Current Positions</h3>
                    <div class="positions-stat-item">
                        <span class="pos-label">Support:</span>
                        <span class="pos-value text-teal">${stats.supportPercentage}% (${stats.support})</span>
                    </div>
                    <div class="positions-stat-item">
                        <span class="pos-label">Oppose:</span>
                        <span class="pos-value text-orange">${stats.opposePercentage}% (${stats.oppose})</span>
                    </div>
                    <div class="positions-stat-item">
                        <span class="pos-label">Undecided:</span>
                        <span class="pos-value text-slate">${stats.undecidedPercentage}% (${stats.undecided})</span>
                    </div>
                </div>

                <!-- 4. Add Argument Section -->
                <div class="add-argument-section">
                    <h3 class="section-card-title">Add an Argument</h3>

                    <form id="argument-form">
                        <textarea
                            id="argument-content"
                            placeholder="Write your argument..."
                            required
                        ></textarea>

                        <select id="argument-side">
                            <option value="support">Support</option>
                            <option value="oppose">Oppose</option>
                        </select>

                        <button type="submit">Submit Argument</button>

                        <p id="argument-message"></p>
                    </form>
                </div>
            </article>

        </div>

        <!-- ============================================== -->
        <!-- RIGHT PANEL (Community Responses - Scrollable) -->
        <!-- ============================================== -->
        <div class="debate-right-panel">
            <div class="community-panel-header">
                <h2>Community Responses</h2>
            </div>

            <div class="community-columns">
                <!-- Supportive Arguments Column (Arguments with side = Support) -->
                <div class="community-col support-responses-column">
                    <h3 class="community-col-title text-teal">Supportive Arguments</h3>

                    <div class="community-col-list">
                        ${supportArguments.length === 0
                            ? `
                            <div class="empty-state-mini">
                                <p>No supportive arguments yet.</p>
                                <span>Be the first to take a stand!</span>
                            </div>
                            `
                            : supportArguments.map(arg => renderArgumentThread(arg)).join("")
                        }
                    </div>
                </div>

                <!-- Opposing Arguments Column (Arguments with side = Oppose) -->
                <div class="community-col oppose-responses-column">
                    <h3 class="community-col-title text-orange">Opposing Arguments</h3>

                    <div class="community-col-list">
                        ${opposeArguments.length === 0
                            ? `
                            <div class="empty-state-mini">
                                <p>No opposing arguments yet.</p>
                                <span>Be the first to challenge this position!</span>
                            </div>
                            `
                            : opposeArguments.map(arg => renderArgumentThread(arg)).join("")
                        }
                    </div>
                </div>
            </div>
        </div>

    </div>
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
            <div class="nav-left">
                <a href="/" data-link>Home</a>
                <a href="/create" data-link>New Debate</a>
            </div>

            <a href="/" class="nav-logo" data-link>
                <span class="logo-debate">Debate</span><span class="logo-hub">Hub</span>
            </a>

            <div class="nav-right">
                <a href="/profile" data-link>Profile</a>
                <button id="logout-button">Logout</button>
            </div>
        `;
    }

    return `
        <div class="nav-left">
            <a href="/" data-link>Home</a>
            <a href="/search" data-link>Search</a>
        </div>

        <a href="/" class="nav-logo" data-link>
            <span class="logo-debate">Debate</span><span class="logo-hub">Hub</span>
        </a>

        <div class="nav-right">
            <a href="/login" data-link>Login</a>
            <a href="/register" data-link>Register</a>
        </div>
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
//User clicks Reply
//        ↓
// submit event
//        ↓
// event.target = response form
//        ↓
// form.dataset.argumentId
//        ↓
// createResponse()
//        ↓
// state.appData.responses.push(...)
//        ↓
// saveState()
//        ↓
// render()
//        ↓
// response appears

// createArgument()
//       ↓
// argument object created
//       ↓
// state.appData.arguments.push(argument)
//       ↓
// later ui.js reads state.appData.arguments
//       ↓
// .map(argument => ...)
//       ↓
// argument.id