import { router } from "./router.js";
import { loadState } from "./storage.js";
import { registerUser } from "./auth.js";
import { loginUser } from "./auth.js";
import { renderNavbar } from "./ui.js";
import { logoutUser } from "./auth.js";
import { createDebate } from "./debates.js";
import { setPosition } from "./positions.js";
import { createArgument } from "./arguments.js";
import { voteOnArgument, voteOnResponse } from "./votes.js";
import { createResponse } from "./responses.js";

const app = document.querySelector("#app");

function render() {
    document.querySelector("#navbar").innerHTML = renderNavbar();
    app.innerHTML = router();
}

document.addEventListener("click", (event) => {

    const link = event.target.closest("[data-link]");

    if (link) {
        event.preventDefault();

        const url = link.getAttribute("href");

        window.history.pushState({}, "", url);

        render();
        return;
    }

    if (event.target.id === "logout-button") {
        logoutUser();

        window.history.pushState({}, "", "/");
        render();
    }

    const positionButton = event.target.closest("[data-position]");

    if (positionButton) {

        const value = positionButton.dataset.position;

        const path = window.location.pathname;
        const parts = path.split("/");
        const debateId = parts[2];

        const result = setPosition(debateId, value);

        if (!result.success) {
            console.log(result.message);
            return;
        }

        render();
    }

    //voting in arguments
    if (event.target.dataset.vote) {

    const value = event.target.dataset.vote;

    const argumentId = event.target.dataset.argumentId;
    const responseId = event.target.dataset.responseId;

    if (argumentId) {

        const result = voteOnArgument(argumentId, value);

        if (result.success) {
            render();
        }

    } else if (responseId) {

        const result = voteOnResponse(responseId, value);

        if (result.success) {
            render();
        }
    }
    }
});

document.addEventListener("submit", (event) => {

    if (event.target.id === "register-form") {
        event.preventDefault();

        const form = event.target;

        const email = form.querySelector("#email").value.trim();
        const phone = form.querySelector("#phone").value.trim();
        const password = form.querySelector("#password").value;

        const result = registerUser({
            email,
            phone,
            password
        });

        const message = document.querySelector("#register-message");

        if (!result.success) {
            message.textContent = result.message;
            return;
        }

        message.textContent = "Registration successful!";
    }


    //LOGIN
    if (event.target.id === "login-form") {

        event.preventDefault();

        const form = event.target;

        const email = form.querySelector("#login-email").value.trim();
        const phone = form.querySelector("#login-phone").value.trim();
        const password = form.querySelector("#login-password").value;

        const result = loginUser({
            email,
            phone,
            password
        });

        const message = document.querySelector("#login-message");

        if (!result.success) {
            message.textContent = result.message;
            return;
        }

        window.history.pushState({}, "", "/");
        render();
    }

    //debate-form
    if (event.target.id === "create-debate-form") {

        event.preventDefault();

        const form = event.target;

        const title = form.querySelector("#debate-title").value.trim();
        const description = form.querySelector("#debate-description").value.trim();
        const topic = form.querySelector("#debate-topic").value.trim();

        const tags = form
            .querySelector("#debate-tags")
            .value
            .split(",")
            .map(tag => tag.trim())
            .filter(tag => tag !== "");

        const result = createDebate({
            title,
            description,
            topic,
            tags
        });

        const message = document.querySelector("#debate-message");

        if (!result.success) {
            message.textContent = result.message;
            return;
        }

        window.history.pushState(
            {},
            "",
            `/debate/${result.debate.id}`
        );

        render();
    }

    //Argument form
    if (event.target.id === "argument-form") {

        event.preventDefault();

        const form = event.target;

        const content = form
            .querySelector("#argument-content")
            .value
            .trim();

        const side = form
            .querySelector("#argument-side")
            .value;

        const parts = window.location.pathname.split("/");
        const debateId = parts[2];

        const result = createArgument({
            debateId,
            side,
            content
        });

        const message = document.querySelector("#argument-message");

        if (!result.success) {
            message.textContent = result.message;
            return;
        }

        message.textContent = "Argument submitted!";

        render();
    }

    //response
    if (event.target.classList.contains("response-form")) {
    event.preventDefault();

    const form = event.target;

    const content = form.querySelector("textarea").value.trim();

    const argumentId = form.dataset.argumentId;

    const result = createResponse({
        argumentId,
        content
    });

    if (!result.success) {
        form.querySelector(".response-message").textContent =
            result.message;

        return;
    }

    render();
    }

});


window.addEventListener("popstate", () => {
    render();
});

loadState();

render();

//[data-link] is a CSS selector meaning: Find an element that has a data-link attribute.
//event.target is the elemnet that was actually clicked
//closest then finds the nearest ancestor matching [data-link]
/*event.preventDefault(); stop browser from reload
normally <a href="/profile"> --> means browser, go request /profile
but now we SAY JS will handle this. so server doesnt get asked for /profile
*/
/*const url = link.getAttribute("href"); get the destination
<a href="/profile" data-link>Profile</a>
we get "/profile"
*/
//window.history.pushState({}, "", url); this changes the browser url without reloading that is / change to /profile but the browser doesnt request for /profile

// URL changed
//     ↓
// router()
//     ↓
// window.location.pathname
//     ↓
// "/profile"
//     ↓
// Profile UI

//popstate tells us when the browserr history navigation changes the active history entry

// index.html
//      │
//      ▼
//    app.js
//      │
//      ├── handles browser events
//      ├── handles navigation
//      └── renders application
//             │
//             ▼
//         router.js
//             │
//             └── determines view
//                     │
//                     ▼
//                   ui.js
//                     │
//                     └── generates UI