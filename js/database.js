// Database Module - Firestore Operations
import { db } from './firebase-config.js';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Collection names
const COLLECTIONS = {
    USERS: 'users',
    SAVED_PROJECTS: 'savedProjects',
    USER_PREFERENCES: 'userPreferences'
};

// ================================
// User Data Management
// ================================

// Create or update user profile
export async function createUserProfile(userId, userData) {
    try {
        const userRef = doc(db, COLLECTIONS.USERS, userId);
        await setDoc(userRef, {
            ...userData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }, { merge: true });

        console.log('✅ User profile created/updated');
        return true;
    } catch (error) {
        console.error('Error creating user profile:', error);
        throw error;
    }
}

// Get user profile
export async function getUserProfile(userId) {
    try {
        const userRef = doc(db, COLLECTIONS.USERS, userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return userSnap.data();
        } else {
            console.log('No user profile found');
            return null;
        }
    } catch (error) {
        console.error('Error getting user profile:', error);
        throw error;
    }
}

// ================================
// Saved Projects Management
// ================================

// Save a project for user
export async function saveProject(userId, projectId, projectData) {
    try {
        const savedProjectRef = doc(db, COLLECTIONS.SAVED_PROJECTS, `${userId}_${projectId}`);
        await setDoc(savedProjectRef, {
            userId,
            projectId,
            ...projectData,
            savedAt: serverTimestamp()
        });

        console.log('✅ Project saved');
        showToast('Project saved to your collection!');
        return true;
    } catch (error) {
        console.error('Error saving project:', error);
        showToast('Failed to save project', 'error');
        throw error;
    }
}

// Remove saved project
export async function unsaveProject(userId, projectId) {
    try {
        const savedProjectRef = doc(db, COLLECTIONS.SAVED_PROJECTS, `${userId}_${projectId}`);
        await deleteDoc(savedProjectRef);

        console.log('✅ Project removed from saved');
        showToast('Project removed from your collection');
        return true;
    } catch (error) {
        console.error('Error removing saved project:', error);
        showToast('Failed to remove project', 'error');
        throw error;
    }
}

// Get all saved projects for a user
export async function getSavedProjects(userId) {
    try {
        const savedProjectsRef = collection(db, COLLECTIONS.SAVED_PROJECTS);
        const q = query(
            savedProjectsRef,
            where('userId', '==', userId),
            orderBy('savedAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const savedProjects = [];

        querySnapshot.forEach((doc) => {
            savedProjects.push({
                id: doc.id,
                ...doc.data()
            });
        });

        console.log(`✅ Found ${savedProjects.length} saved projects`);
        return savedProjects;
    } catch (error) {
        console.error('Error getting saved projects:', error);
        throw error;
    }
}

// Check if a project is saved by user
export async function isProjectSaved(userId, projectId) {
    try {
        const savedProjectRef = doc(db, COLLECTIONS.SAVED_PROJECTS, `${userId}_${projectId}`);
        const savedProjectSnap = await getDoc(savedProjectRef);
        return savedProjectSnap.exists();
    } catch (error) {
        console.error('Error checking if project is saved:', error);
        return false;
    }
}

// ================================
// User Preferences Management
// ================================

// Save user preferences (theme, settings, etc.)
export async function saveUserPreferences(userId, preferences) {
    try {
        const preferencesRef = doc(db, COLLECTIONS.USER_PREFERENCES, userId);
        await setDoc(preferencesRef, {
            ...preferences,
            updatedAt: serverTimestamp()
        }, { merge: true });

        console.log('✅ User preferences saved');
        return true;
    } catch (error) {
        console.error('Error saving user preferences:', error);
        throw error;
    }
}

// Get user preferences
export async function getUserPreferences(userId) {
    try {
        const preferencesRef = doc(db, COLLECTIONS.USER_PREFERENCES, userId);
        const preferencesSnap = await getDoc(preferencesRef);

        if (preferencesSnap.exists()) {
            return preferencesSnap.data();
        } else {
            // Return default preferences
            return {
                theme: 'light',
                emailNotifications: true
            };
        }
    } catch (error) {
        console.error('Error getting user preferences:', error);
        return null;
    }
}

// ================================
// Helper Functions
// ================================

// Load all user data (profile, saved projects, preferences)
export async function loadUserData(userId) {
    try {
        console.log('📥 Loading user data...');

        // Load user profile
        const profile = await getUserProfile(userId);

        // Load saved projects
        const savedProjects = await getSavedProjects(userId);

        // Load preferences
        const preferences = await getUserPreferences(userId);

        // Update UI with saved projects
        updateSavedProjectsUI(savedProjects);

        // Apply user preferences (theme, etc.)
        if (preferences.theme) {
            applyTheme(preferences.theme);
        }

        console.log('✅ User data loaded successfully');
        return {
            profile,
            savedProjects,
            preferences
        };
    } catch (error) {
        console.error('Error loading user data:', error);
        throw error;
    }
}

// Clear user data from UI (on sign out)
export function clearUserData() {
    console.log('🧹 Clearing user data from UI');

    // Remove all "saved" states from project cards
    const saveButtons = document.querySelectorAll('.save-btn.saved');
    saveButtons.forEach(btn => {
        btn.classList.remove('saved');
    });
}

// Update UI to show saved projects
function updateSavedProjectsUI(savedProjects) {
    const savedProjectIds = savedProjects.map(p => p.projectId);

    // Add "saved" class to saved project buttons
    savedProjectIds.forEach(projectId => {
        const saveBtn = document.querySelector(`[data-project-id="${projectId}"]`);
        if (saveBtn && saveBtn.classList.contains('save-btn')) {
            saveBtn.classList.add('saved');
        }
    });
}

// Apply theme preference
function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        const themeIcon = document.querySelector('#themeToggle i');
        if (themeIcon) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    } else {
        document.documentElement.removeAttribute('data-theme');
        const themeIcon = document.querySelector('#themeToggle i');
        if (themeIcon) {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }
}

// Show toast notification (shared with auth.js)
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

// Export helper functions to be used by other modules
window.loadUserData = loadUserData;
window.clearUserData = clearUserData;