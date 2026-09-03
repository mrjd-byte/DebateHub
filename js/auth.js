import { state } from "./state.js";
import { saveState } from "./storage.js";

export function registerUser({ email, phone, password }) {

    if (!email && !phone) {
        return {
            success: false,
            message: "Email or phone is required."
        };
    }

    if (!password) {
        return {
            success: false,
            message: "Password is required."
        };
    }

    const existingUser = state.appData.users.find(user =>
        (email && user.email === email) ||
        (phone && user.phone === phone)
    );

    if (existingUser) {
        return {
            success: false,
            message: "Email or phone already registered."
        };
    }

    const user = {
        id: crypto.randomUUID(),
        email: email || null,
        phone: phone || null,
        password
    };

    state.appData.users.push(user);

    saveState();

    return {
        success: true,
        user
    };
}

export function loginUser({ email, phone, password }) {

    if (!email && !phone) {
        return {
            success: false,
            message: "Email or phone is required."
        };
    }

    if (!password) {
        return {
            success: false,
            message: "Password is required."
        };
    }

    const user = state.appData.users.find(user =>
        (
            (email && user.email === email) ||
            (phone && user.phone === phone)
        ) &&
        user.password === password
    );

    if (!user) {
        return {
            success: false,
            message: "Invalid credentials."
        };
    }

    state.auth.isAuthenticated = true;
    state.auth.currentUser = user;

    saveState();

    return {
        success: true,
        user
    };
}

export function logoutUser() {
    state.auth.isAuthenticated = false;
    state.auth.currentUser = null;

    saveState();
}