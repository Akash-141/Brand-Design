// Authentication Module
import { auth } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Authentication state observer
let currentUser = null;

// Initialize auth state listener
export function initAuth() {
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        updateUIForAuthState(user);

        if (user) {
            console.log('✅ User signed in:', user.email);
            // Load user's saved projects
            if (typeof loadUserData === 'function') {
                loadUserData(user.uid);
            }
        } else {
            console.log('👤 No user signed in');
        }
    });
}

// Sign up with email and password
export async function signUpWithEmail(email, password, displayName) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Update user profile with display name
        if (displayName) {
            await updateProfile(userCredential.user, {
                displayName: displayName
            });
        }

        showToast('Account created successfully! Welcome!');
        closeAuthModal();
        return userCredential.user;
    } catch (error) {
        console.error('Sign up error:', error);
        handleAuthError(error);
        throw error;
    }
}

// Sign in with email and password
export async function signInWithEmail(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        showToast('Welcome back!');
        closeAuthModal();
        return userCredential.user;
    } catch (error) {
        console.error('Sign in error:', error);
        handleAuthError(error);
        throw error;
    }
}

// Sign in with Google
export async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        showToast('Signed in with Google successfully!');
        closeAuthModal();
        return result.user;
    } catch (error) {
        console.error('Google sign in error:', error);
        handleAuthError(error);
        throw error;
    }
}

// Sign out
export async function signOutUser() {
    try {
        await signOut(auth);
        showToast('Signed out successfully');
        // Clear any cached user data
        if (typeof clearUserData === 'function') {
            clearUserData();
        }
    } catch (error) {
        console.error('Sign out error:', error);
        showToast('Error signing out', 'error');
        throw error;
    }
}

// Get current user
export function getCurrentUser() {
    return currentUser;
}

// Check if user is authenticated
export function isAuthenticated() {
    return currentUser !== null;
}

// Update UI based on authentication state
function updateUIForAuthState(user) {
    const authBtn = document.getElementById('authBtn');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');

    if (user) {
        // User is signed in
        authBtn.classList.add('hidden');
        userMenu.classList.remove('hidden');

        if (userName) userName.textContent = user.displayName || 'User';
        if (userEmail) userEmail.textContent = user.email;
    } else {
        // User is signed out
        authBtn.classList.remove('hidden');
        userMenu.classList.add('hidden');
    }
}

// Handle authentication errors
function handleAuthError(error) {
    let message = 'An error occurred';

    switch (error.code) {
        case 'auth/email-already-in-use':
            message = 'This email is already registered';
            break;
        case 'auth/invalid-email':
            message = 'Invalid email address';
            break;
        case 'auth/operation-not-allowed':
            message = 'Email/password sign in is not enabled';
            break;
        case 'auth/weak-password':
            message = 'Password should be at least 6 characters';
            break;
        case 'auth/user-disabled':
            message = 'This account has been disabled';
            break;
        case 'auth/user-not-found':
            message = 'No account found with this email';
            break;
        case 'auth/wrong-password':
            message = 'Incorrect password';
            break;
        case 'auth/too-many-requests':
            message = 'Too many failed attempts. Please try again later';
            break;
        case 'auth/popup-closed-by-user':
            message = 'Sign in popup was closed';
            break;
        default:
            message = error.message || 'Authentication failed';
    }

    showToast(message, 'error');
}

// Show authentication modal
export function showAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Close authentication modal
export function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.classList.remove('error');

        if (type === 'error') {
            toast.classList.add('error');
        }

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Make showToast available globally

window.showToast = showToast;
