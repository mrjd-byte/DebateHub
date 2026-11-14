import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";
import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";
import { auth, db } from "./firebase.js";
import { state } from "./state.js";

function authErrorMessage(error) {
    const messages = {
        "auth/invalid-email": "Enter a valid email address.",
        "auth/missing-email": "Email is required.",
        "auth/weak-password": "Password must be at least 6 characters.",
        "auth/email-already-in-use": "An account with this email already exists.",
        "auth/invalid-credential": "Email or password is incorrect.",
        "auth/user-not-found": "Email or password is incorrect.",
        "auth/wrong-password": "Email or password is incorrect.",
        "auth/network-request-failed": "Network error. Check your connection and try again.",
        "permission-denied": "Firebase denied access. Check the Firestore security rules.",
        "unavailable": "Firebase is temporarily unavailable. Try again shortly."
    };

    return messages[error.code] || "Authentication failed. Please try again.";
}

function upsertProfile(profile) {
    const index = state.appData.users.findIndex(user => user.id === profile.id);
    if (index === -1) {
        state.appData.users.push(profile);
    } else {
        state.appData.users[index] = profile;
    }
}

function profileFromAuthUser(user) {
    return {
        id: user.uid,
        username: user.displayName || user.email?.split("@")[0] || "DebateHub User",
        email: user.email || null
    };
}

export async function registerUser({ username, email, password }) {
    const normalizedUsername = username?.trim();
    const normalizedEmail = email?.trim();

    if (!normalizedUsername) {
        return { success: false, message: "Username is required." };
    }
    if (!normalizedEmail) {
        return { success: false, message: "Email is required." };
    }
    if (!password) {
        return { success: false, message: "Password is required." };
    }

    let accountCreated = false;
    try {
        const credential = await createUserWithEmailAndPassword(
            auth,
            normalizedEmail,
            password
        );
        accountCreated = true;

        await updateProfile(credential.user, { displayName: normalizedUsername });
        await setDoc(doc(db, "users", credential.user.uid), {
            username: normalizedUsername,
            email: credential.user.email,
            createdAt: serverTimestamp()
        });

        return { success: true, user: profileFromAuthUser(credential.user) };
    } catch (error) {
        const message = accountCreated
            ? "Your Firebase account was created, but its profile could not be saved. Check your connection and Firestore rules, then reload to retry."
            : error.code === "auth/weak-password"
            ? "Password must be at least 6 characters."
            : error.code === "auth/email-already-in-use"
                ? "An account with this email already exists."
                : error.code === "auth/invalid-email"
                    ? "Enter a valid email address."
                    : error.code === "auth/network-request-failed"
                        ? "Network error. Check your connection and try again."
                        : error.code === "permission-denied"
                            ? "Your account was created, but Firebase denied profile creation. Check the Firestore security rules."
                    : "Could not complete registration. Please try again.";

        return { success: false, message };
    }
}

export async function loginUser({ email, password }) {
    const normalizedEmail = email?.trim();
    if (!normalizedEmail) {
        return { success: false, message: "Email is required." };
    }
    if (!password) {
        return { success: false, message: "Password is required." };
    }

    try {
        const credential = await signInWithEmailAndPassword(
            auth,
            normalizedEmail,
            password
        );
        return { success: true, user: profileFromAuthUser(credential.user) };
    } catch (error) {
        return { success: false, message: authErrorMessage(error) };
    }
}

export async function logoutUser() {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        return { success: false, message: authErrorMessage(error) };
    }
}

export function subscribeToAuthChanges(onChange) {
    let authChangeVersion = 0;

    return onAuthStateChanged(auth, async firebaseUser => {
        const version = ++authChangeVersion;

        if (!firebaseUser) {
            state.auth = {
                status: "ready",
                isAuthenticated: false,
                currentUser: null,
                error: null
            };
            state.navigation.editingDebateId = null;
            state.navigation.editingArgumentId = null;
            onChange();
            return;
        }

        state.auth = {
            status: "loading",
            isAuthenticated: true,
            currentUser: profileFromAuthUser(firebaseUser),
            error: null
        };
        onChange();

        try {
            const profileRef = doc(db, "users", firebaseUser.uid);
            let profileSnapshot = await getDoc(profileRef);

            // Repair a missing profile document using Firebase Auth identity.
            if (!profileSnapshot.exists()) {
                await setDoc(profileRef, {
                    username: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "DebateHub User",
                    email: firebaseUser.email,
                    createdAt: serverTimestamp()
                });
                profileSnapshot = await getDoc(profileRef);
            }

            if (version !== authChangeVersion) return;

            if (!profileSnapshot.exists()) {
                throw new Error("Profile document was not available after creation.");
            }

            const profileData = profileSnapshot.data();
            const profile = {
                id: firebaseUser.uid,
                username: profileData.username || profileFromAuthUser(firebaseUser).username,
                email: profileData.email || firebaseUser.email || null
            };

            upsertProfile(profile);
            state.auth = {
                status: "ready",
                isAuthenticated: true,
                currentUser: profile,
                error: null
            };
        } catch (error) {
            if (version !== authChangeVersion) return;

            state.auth = {
                status: "error",
                isAuthenticated: true,
                currentUser: profileFromAuthUser(firebaseUser),
                error: `Signed in, but the user profile could not be loaded: ${authErrorMessage(error)}`
            };
        }

        onChange();
    }, error => {
        authChangeVersion += 1;
        state.auth = {
            status: "error",
            isAuthenticated: false,
            currentUser: null,
            error: authErrorMessage(error)
        };
        onChange();
    });
}
