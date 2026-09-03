import { router } from "./router.js";
import { loadState } from "./storage.js";
import { registerUser } from "./auth.js";

const app = document.querySelector("#app");

function render() {
    app.innerHTML = router();
}

document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-link]");

    if (!link) {
        return;
    }

    event.preventDefault();

    const url = link.getAttribute("href");

    window.history.pushState({}, "", url);

    render();
});

document.addEventListener("submit", (event) => {

    if (event.target.id !== "register-form") {
        return;
    }

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