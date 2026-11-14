import { router } from "./router.js";
import { loadState } from "./storage.js";
import { registerUser, loginUser, logoutUser, subscribeToAuthChanges } from "./auth.js";
import { renderNavbar } from "./ui.js";
import {createDebate, updateDebate, deleteDebate, fetchDebates} from "./debates.js";
import { setPosition } from "./positions.js";
import { createArgument, updateArgument, deleteArgument, fetchArguments } from "./arguments.js";
import { voteOnArgument, voteOnResponse } from "./votes.js";
import { createResponse, updateResponse, deleteResponse, fetchResponsesForArgument } from "./responses.js";
import { state } from "./state.js";

const app = document.querySelector("#app");

function render() {
    document.querySelector("#navbar").innerHTML = renderNavbar();
    app.innerHTML = router();
}

document.addEventListener("click", async (event) => {

    const link = event.target.closest("[data-link]");

    if (link) {
        event.preventDefault();

        const url = link.getAttribute("href");

        window.history.pushState({}, "", url);

        if (url.startsWith("/debate/")) {
            const debateId = url.split("/")[2];
            fetchArguments(debateId).then(() => render());
        }

        render();
        return;
    }

    if (event.target.id === "logout-button") {
        const result = await logoutUser();
        if (!result.success) {
            window.alert(result.message);
            return;
        }

        window.history.pushState({}, "", "/");
        render();
    }

    const positionButton = event.target.closest("[data-position]");

    if (positionButton) {

        const value = positionButton.dataset.position;

        const path = window.location.pathname;
        const parts = path.split("/");
        const debateId = parts[2];

        positionButton.disabled = true;
        const result = await setPosition(debateId, value);
        positionButton.disabled = false;

        if (!result.success) {
            console.log(result.message);
            window.alert(result.message);
            return;
        }

        render();
    }

    // voting in arguments & responses
    const voteBtn = event.target.closest("[data-vote]");
    if (voteBtn) {

        const value = voteBtn.dataset.vote;
        const argumentId = voteBtn.dataset.argumentId;
        const responseId = voteBtn.dataset.responseId;

        voteBtn.disabled = true;
        if (argumentId) {

            const result = await voteOnArgument(argumentId, value);
            voteBtn.disabled = false;

            if (!result.success) {
                console.log(result.message);
                window.alert(result.message);
                return;
            }

            render();

        } else if (responseId) {

            const result = await voteOnResponse(responseId, value);
            voteBtn.disabled = false;

            if (!result.success) {
                console.log(result.message);
                window.alert(result.message);
                return;
            }

            render();
        }
    }
    //edit-debate
    if (event.target.dataset.editDebate) {

    state.navigation.editingDebateId =
        event.target.dataset.editDebate;

    render();

    return;
}
if (event.target.id === "cancel-edit") {

    state.navigation.editingDebateId = null;

    render();

    return;
}
//Delete debate
const deleteButton = event.target.closest("[data-delete-debate]");

if (deleteButton) {

    console.log("DELETE BUTTON CLICKED");

    const debateId = deleteButton.dataset.deleteDebate;

    console.log("Debate ID:", debateId);

    const confirmed = confirm(
        "Are you sure you want to delete this debate?"
    );

    if (!confirmed) {
        return;
    }

    deleteButton.disabled = true;

    const result = await deleteDebate(debateId);

    console.log("Delete result:", result);

    if (!result.success) {
        deleteButton.disabled = false;
        console.error(result.message);
        window.alert(result.message);
        return;
    }

    history.pushState({}, "", "/");

    render();

    return;
}

//update the arguments
const editArgumentButton =
    event.target.closest("[data-edit-argument]");

if (editArgumentButton) {
    const argumentId =
        editArgumentButton.dataset.editArgument;

    state.navigation.editingArgumentId = argumentId;

    render();

    return;
}
if (event.target.closest(".cancel-edit-argument")) {
    state.navigation.editingArgumentId = null;

    render();

    return;
}

// Delete argument
const deleteArgBtn = event.target.closest("[data-delete-argument]");
if (deleteArgBtn) {
    const argumentId = deleteArgBtn.dataset.deleteArgument;
    const confirmed = confirm("Are you sure you want to delete this argument?");
    if (!confirmed) return;

    deleteArgBtn.disabled = true;

    const parts = window.location.pathname.split("/");
    const debateId = parts[2];

    const result = await deleteArgument(argumentId, debateId);
    if (!result.success) {
        deleteArgBtn.disabled = false;
        alert(result.message);
        return;
    }

    render();
    return;
}

// Edit response
const editRespBtn = event.target.closest("[data-edit-response]");
if (editRespBtn) {
    state.navigation.editingResponseId = editRespBtn.dataset.editResponse;
    render();
    return;
}
if (event.target.closest(".cancel-edit-response")) {
    state.navigation.editingResponseId = null;
    render();
    return;
}

// Delete response
const deleteRespBtn = event.target.closest("[data-delete-response]");
if (deleteRespBtn) {
    const responseId = deleteRespBtn.dataset.deleteResponse;
    const argumentId = deleteRespBtn.dataset.argumentId;
    const confirmed = confirm("Are you sure you want to delete this reply?");
    if (!confirmed) return;

    deleteRespBtn.disabled = true;
    const debateId = window.location.pathname.split("/")[2];

    const result = await deleteResponse(responseId, { debateId, argumentId });
    if (!result.success) {
        deleteRespBtn.disabled = false;
        alert(result.message);
        return;
    }

    render();
    return;
}

});

document.addEventListener("submit", async (event) => {

    if (event.target.id === "register-form") {
        event.preventDefault();

        const form = event.target;

        const username = document.querySelector("#username").value.trim();
        const email = form.querySelector("#email").value.trim();
        const password = form.querySelector("#password").value;

        const result = await registerUser({
            username,
            email,
            password
        });

        const message = document.querySelector("#register-message");

        if (!result.success) {
            message.textContent = result.message;
            return;
        }

        window.history.pushState({}, "", "/");
        render();
    }


    //LOGIN
    if (event.target.id === "login-form") {

        event.preventDefault();

        const form = event.target;

        const email = form.querySelector("#login-email").value.trim();
        const password = form.querySelector("#login-password").value;

        const result = await loginUser({
            email,
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

        const submitBtn = form.querySelector("button[type='submit']");
        const message = document.querySelector("#debate-message");

        if (submitBtn) submitBtn.disabled = true;
        if (message) message.textContent = "Creating debate...";

        const result = await createDebate({
            title,
            description,
            topic,
            tags
        });

        if (!result.success) {
            if (submitBtn) submitBtn.disabled = false;
            if (message) message.textContent = result.message;
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

        const submitBtn = form.querySelector("button[type='submit']");
        const message = document.querySelector("#argument-message");

        if (submitBtn) submitBtn.disabled = true;
        if (message) message.textContent = "Submitting argument...";

        const result = await createArgument({
            debateId,
            side,
            content
        });

        if (!result.success) {
            if (submitBtn) submitBtn.disabled = false;
            if (message) message.textContent = result.message;
            return;
        }

        form.querySelector("#argument-content").value = "";
        if (submitBtn) submitBtn.disabled = false;
        if (message) message.textContent = "Argument submitted!";

        render();
    }

    //response
    if (event.target.classList.contains("response-form")) {
        event.preventDefault();

        const form = event.target;
        const content = form.querySelector("textarea").value.trim();
        const argumentId = form.dataset.argumentId;
        const debateId = window.location.pathname.split("/")[2];

        const submitBtn = form.querySelector("button[type='submit']");
        const message = form.querySelector(".response-message");

        if (submitBtn) submitBtn.disabled = true;
        if (message) message.textContent = "Posting reply...";

        const result = await createResponse({
            debateId,
            argumentId,
            content
        });

        if (!result.success) {
            if (submitBtn) submitBtn.disabled = false;
            if (message) message.textContent = result.message;
            return;
        }

        form.querySelector("textarea").value = "";
        if (submitBtn) submitBtn.disabled = false;
        if (message) message.textContent = "";

        render();
        return;
    }

    //edit-response
    if (event.target.classList.contains("edit-response-form")) {
        event.preventDefault();

        const form = event.target;
        const responseId = form.dataset.responseId;
        const argumentId = form.dataset.argumentId;
        const debateId = window.location.pathname.split("/")[2];
        const content = form.querySelector(".edit-response-content").value.trim();

        const submitBtn = form.querySelector("button[type='submit']");
        const message = form.querySelector(".edit-response-message");

        if (submitBtn) submitBtn.disabled = true;
        if (message) message.textContent = "Saving changes...";

        const result = await updateResponse(responseId, {
            debateId,
            argumentId,
            content
        });

        if (!result.success) {
            if (submitBtn) submitBtn.disabled = false;
            if (message) {
                message.textContent = result.message;
            } else {
                alert(result.message);
            }
            return;
        }

        state.navigation.editingResponseId = null;

        render();
        return;
    }

    if (event.target.id === "edit-debate-form") {
    event.preventDefault();

    const form = event.target;

    const title = form.querySelector("#edit-title").value.trim();
    const description = form.querySelector("#edit-description").value.trim();
    const topic = form.querySelector("#edit-topic").value.trim();

    const tags = form
        .querySelector("#edit-tags")
        .value
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag !== "");

    const debateId = state.navigation.editingDebateId;

    const submitBtn = form.querySelector("button[type='submit']");
    const message = form.querySelector("#edit-debate-message");

    if (submitBtn) submitBtn.disabled = true;
    if (message) message.textContent = "Saving changes...";

    const result = await updateDebate(debateId, {
        title,
        description,
        topic,
        tags
    });

    if (!result.success) {
        if (submitBtn) submitBtn.disabled = false;
        if (message) {
            message.textContent = result.message;
        } else {
            window.alert(result.message);
        }
        console.log(result.message);
        return;
    }

    // Leave edit mode after successful update
    state.navigation.editingDebateId = null;

    render();
}

//update-arg
if (event.target.classList.contains("edit-argument-form")) {
    event.preventDefault();

    const form = event.target;

    const argumentId = form.dataset.argumentId;

    const content =
        form
            .querySelector(".edit-argument-content")
            .value
            .trim();

    const side =
        form
            .querySelector(".edit-argument-side")
            .value;

    const submitBtn = form.querySelector("button[type='submit']");
    const message = form.querySelector(".edit-argument-message");

    if (submitBtn) submitBtn.disabled = true;
    if (message) message.textContent = "Saving changes...";

    const result = await updateArgument(argumentId, {
        content,
        side
    });

    if (!result.success) {
        if (submitBtn) submitBtn.disabled = false;
        if (message) {
            message.textContent = result.message;
        } else {
            alert(result.message);
        }
        console.log(result.message);
        return;
    }

    state.navigation.editingArgumentId = null;

    render();

    return;
}


});


window.addEventListener("popstate", () => {
    const path = window.location.pathname;
    if (path.startsWith("/debate/")) {
        const debateId = path.split("/")[2];
        fetchArguments(debateId).then(() => render());
    }
    render();
});

loadState();
render();
subscribeToAuthChanges(render);

const initialPath = window.location.pathname;
if (initialPath.startsWith("/debate/")) {
    const initialDebateId = initialPath.split("/")[2];
    fetchArguments(initialDebateId).then(() => render());
}

fetchDebates().then(() => {
    render();
});

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
