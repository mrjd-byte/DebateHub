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
        <h1>Debate Platform</h1>
        <p>Explore debates and different perspectives.</p>

        <section>
            <h2>Available Debates</h2>

            ${debates.length === 0
      ? "<p>No debates yet.</p>"
      : debates.map(debate => `
                        <article>
                            <h3>
                                <a href="/debate/${debate.id}" data-link>
                                    ${escapeHTML(debate.title)}
                                </a>
                            </h3>

                            <p>${escapeHTML(debate.description)}</p>

                            <p>
                                Topic: ${escapeHTML(debate.topic)}
                            </p>
                        </article>
                    `).join("")
    }
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
      <h1>Debate Not Found</h1>
      <p>The debate you're looking for does not exist.</p>
    `;
  }

  const stats = getPositionStats(debateId);

  return `
    <article>
      <h1>${escapeHTML(debate.title)}</h1>
      <p>By ${escapeHTML(getAuthorName(debate.authorId))} · ${formatTime(debate.createdAt)}</p>
      
      <p>${escapeHTML(debate.description)}</p>

      <p>
        <strong>Topic:</strong> ${escapeHTML(debate.topic)}
      </p>

      <div>
        <strong>Tags:</strong>
        ${debate.tags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join(" ")}
      </div>

      <div>
        <button class="position-button support-button" data-position="support">
            Support
        </button>

        <button class="position-button oppose-button" data-position="oppose">
            Oppose
        </button>

        <button class="position-button undecided-button" data-position="undecided">
            Undecided
        </button>
      </div>
      <div>
        <h3>Current Positions</h3>

        <p>
          Support: ${stats.supportPercentage}% (${stats.support})
        </p>

        <p>
          Oppose: ${stats.opposePercentage}% (${stats.oppose})
        </p>

        <p>
          Undecided: ${stats.undecidedPercentage}% (${stats.undecided})
        </p>
      </div>

      <section>
        <h2>Add an Argument</h2>

        <form id="argument-form">
          <textarea
            id="argument-content"
            placeholder="Write your argument..."
          ></textarea>

          <select id="argument-side">
            <option value="support">Support</option>
            <option value="oppose">Oppose</option>
          </select>

          <button type="submit">Submit Argument</button>

          <p id="argument-message"></p>
        </form>
      </section>

      <section>
        <h2>Supporting Arguments</h2>

        ${supportArguments.length === 0
      ? `
        <div class="empty-state">
            <p>No supporting arguments yet.</p>
            <span>Be the first to take a stand!</span>
        </div>
      `
      : supportArguments
        .map((argument) => {
          const votes = getArgumentVoteStats(argument.id);

          const responses = state.appData.responses.filter(
            (response) => response.argumentId === argument.id
          );

          return `
    <article class="argument-card support-argument">

        <div class="argument-author">
            <strong>${escapeHTML(getAuthorName(argument.authorId))}</strong>
            <span>· ${formatTime(argument.createdAt)}</span>
        </div>

        <p class="argument-content">
            ${escapeHTML(argument.content)}
        </p>

        <div class="argument-actions">

            <button
                data-vote="up"
                data-argument-id="${argument.id}"
            >
                ↑ ${votes.upvotes}
            </button>

            <button
                data-vote="down"
                data-argument-id="${argument.id}"
            >
                ↓ ${votes.downvotes}
            </button>

            <button type="button">
                💬 ${responses.length}
            </button>

            <button type="button">
                Reply
            </button>

        </div>

        <section class="responses">

            <h4>Responses</h4>

            ${responses.length === 0
              ? `<p class="no-responses">No responses yet.</p>`
              : responses.map(response => {

                const stats = getResponseVoteStats(response.id);

                return `
                            <div class="response">

                                <div class="response-author">
                                    <strong>
                                        ${escapeHTML(
                  getAuthorName(response.authorId)
                )}
                                    </strong>

                                    <span>
                                        · ${formatTime(response.createdAt)}
                                    </span>
                                </div>

                                <p class="response-content">
                                    ${escapeHTML(response.content)}
                                </p>

                                <div class="response-actions">

                                    <button
                                        data-vote="up"
                                        data-response-id="${response.id}"
                                    >
                                        👍 ${stats.upvotes}
                                    </button>

                                    <button
                                        data-vote="down"
                                        data-response-id="${response.id}"
                                    >
                                        👎 ${stats.downvotes}
                                    </button>

                                </div>

                            </div>
                        `;
              }).join("")
            }

            <form
                class="response-form"
                data-argument-id="${argument.id}"
            >

                <textarea
                    placeholder="Respond to this argument..."
                ></textarea>

                <button type="submit">
                    Reply
                </button>

            </form>

        </section>

    </article>
`;

        })
        .join("")
    }
      </section>

      <section>
        <h2>Opposing Arguments</h2>

        ${opposeArguments.length === 0
      ? `
        <div class="empty-state">
            <p>No opposing arguments yet.</p>
            <span>Be the first to challenge this position!</span>
        </div>
      `
      : opposeArguments
        .map((argument) => {
          const votes = getArgumentVoteStats(argument.id);

          const responses = state.appData.responses.filter(
            (response) => response.argumentId === argument.id
          );

return `
    <article class="argument-card support-argument">

        <div class="argument-author">
            <strong>${escapeHTML(getAuthorName(argument.authorId))}</strong>
            <span>· ${formatTime(argument.createdAt)}</span>
        </div>

        <p class="argument-content">
            ${escapeHTML(argument.content)}
        </p>

        <div class="argument-actions">

            <button
                data-vote="up"
                data-argument-id="${argument.id}"
            >
                ↑ ${votes.upvotes}
            </button>

            <button
                data-vote="down"
                data-argument-id="${argument.id}"
            >
                ↓ ${votes.downvotes}
            </button>

            <button type="button">
                💬 ${responses.length}
            </button>

            <button type="button">
                Reply
            </button>

        </div>

        <section class="responses">

            <h4>Responses</h4>

            ${
                responses.length === 0
                    ?`<p class="no-responses">
                          No responses yet. Start the conversation.
                      </p>`
                    : responses.map(response => {

                        const stats = getResponseVoteStats(response.id);

                        return `
                            <div class="response">

                                <div class="response-author">
                                    <strong>
                                        ${escapeHTML(
                                            getAuthorName(response.authorId)
                                        )}
                                    </strong>

                                    <span>
                                        · ${formatTime(response.createdAt)}
                                    </span>
                                </div>

                                <p class="response-content">
                                    ${escapeHTML(response.content)}
                                </p>

                                <div class="response-actions">

                                    <button
                                        data-vote="up"
                                        data-response-id="${response.id}"
                                    >
                                        👍 ${stats.upvotes}
                                    </button>

                                    <button
                                        data-vote="down"
                                        data-response-id="${response.id}"
                                    >
                                        👎 ${stats.downvotes}
                                    </button>

                                </div>

                            </div>
                        `;
                    }).join("")
            }

            <form
                class="response-form"
                data-argument-id="${argument.id}"
            >

                <textarea
                    placeholder="Respond to this argument..."
                ></textarea>

                <button type="submit">
                    Reply
                </button>

            </form>

        </section>

    </article>
`;
        })
        .join("")
    }
      </section>

      
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