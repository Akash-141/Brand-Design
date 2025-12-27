// Main Application Logic
import { initAuth, signInWithEmail, signUpWithEmail, signInWithGoogle, signOutUser, getCurrentUser } from './auth.js';
import { saveProject, unsaveProject, isProjectSaved, saveUserPreferences, loadUserData } from './database.js';

// ================================
// Application State
// ================================

let currentFilter = 'all';
let savedProjectsCache = new Set();

// ================================
// Initialization
// ================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Application starting...');

    // Initialize Firebase Authentication
    initAuth();

    // Initialize UI components
    initNavigation();
    initThemeToggle();
    initAuthModals();
    initProjectFilters();
    initProjectCards();
    initHeroAnimations();
    initScrollEffects();
    initContactForm();

    // Hide loading screen
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }, 1000);

    console.log('✅ Application initialized');
});

// ================================
// Navigation
// ================================

function initNavigation() {
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');

    // Smooth scroll for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetSection = document.getElementById(targetId);

                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });

                    // Update active state
                    navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            }
        });
    });

    // Navbar scroll effect
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });

    // Hero button actions
    const exploreBtn = document.getElementById('exploreBtn');
    if (exploreBtn) {
        exploreBtn.addEventListener('click', () => {
            document.getElementById('projects').scrollIntoView({ behavior: 'smooth' });
        });
    }

    const contactHeroBtn = document.getElementById('contactHeroBtn');
    if (contactHeroBtn) {
        contactHeroBtn.addEventListener('click', () => {
            document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
        });
    }
}

// ================================
// Theme Toggle
// ================================

function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle ?.querySelector('i');

    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    themeToggle ?.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        applyTheme(newTheme);

        // Save to localStorage
        localStorage.setItem('theme', newTheme);

        // Save to Firebase if user is logged in
        const user = getCurrentUser();
        if (user) {
            saveUserPreferences(user.uid, { theme: newTheme }).catch(console.error);
        }
    });
}

function applyTheme(theme) {
    const themeIcon = document.querySelector('#themeToggle i');

    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeIcon) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    } else {
        document.documentElement.removeAttribute('data-theme');
        if (themeIcon) {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }
}

// ================================
// Authentication Modals
// ================================

function initAuthModals() {
    const authModal = document.getElementById('authModal');
    const authBtn = document.getElementById('authBtn');
    const closeAuthModal = document.getElementById('closeAuthModal');
    const showSignup = document.getElementById('showSignup');
    const showLogin = document.getElementById('showLogin');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const logoutBtn = document.getElementById('logoutBtn');

    // Show auth modal
    authBtn ?.addEventListener('click', () => {
        authModal ?.classList.add('active');
    });

    // Close auth modal
    closeAuthModal ?.addEventListener('click', () => {
        authModal ?.classList.remove('active');
    });

    // Close modal on outside click
    authModal ?.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.classList.remove('active');
        }
    });

    // Switch between login and signup
    showSignup ?.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    });

    showLogin ?.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    // Handle login form submission
    const loginFormElement = document.getElementById('loginFormElement');
    loginFormElement ?.addEventListener('submit', async(e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            await signInWithEmail(email, password);
            loginFormElement.reset();
        } catch (error) {
            console.error('Login failed:', error);
        }
    });

    // Handle signup form submission
    const signupFormElement = document.getElementById('signupFormElement');
    signupFormElement ?.addEventListener('submit', async(e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;

        try {
            await signUpWithEmail(email, password, name);
            signupFormElement.reset();
        } catch (error) {
            console.error('Signup failed:', error);
        }
    });

    // Google sign in buttons
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    const googleSignupBtn = document.getElementById('googleSignupBtn');

    googleLoginBtn ?.addEventListener('click', async() => {
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error('Google login failed:', error);
        }
    });

    googleSignupBtn ?.addEventListener('click', async() => {
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error('Google signup failed:', error);
        }
    });

    // Logout
    logoutBtn ?.addEventListener('click', async(e) => {
        e.preventDefault();
        try {
            await signOutUser();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    });
}

// ================================
// Project Filters
// ================================

function initProjectFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    const projectCards = document.querySelectorAll('.project-card');

    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const filter = tab.getAttribute('data-filter');
            currentFilter = filter;

            // Update active tab
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Filter projects
            filterProjects(filter, projectCards);
        });
    });
}

function filterProjects(filter, projectCards) {
    projectCards.forEach(card => {
        const categories = card.getAttribute('data-category');

        if (filter === 'all' || categories.includes(filter)) {
            card.classList.remove('hidden');
            setTimeout(() => {
                card.style.display = 'block';
            }, 10);
        } else {
            card.classList.add('hidden');
            setTimeout(() => {
                if (card.classList.contains('hidden')) {
                    card.style.display = 'none';
                }
            }, 300);
        }
    });
}

// ================================
// Project Cards
// ================================

function initProjectCards() {
    // Save project buttons
    const saveButtons = document.querySelectorAll('.save-btn');
    saveButtons.forEach(btn => {
        btn.addEventListener('click', async(e) => {
            e.stopPropagation();
            await handleSaveProject(btn);
        });
    });

    // View project details buttons
    const viewButtons = document.querySelectorAll('.view-project-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const projectId = btn.getAttribute('data-project-id');
            viewProjectDetails(projectId);
        });
    });

    // Case study links
    const caseStudyLinks = document.querySelectorAll('[data-case-study]');
    caseStudyLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const projectId = link.getAttribute('data-case-study');
            showToast('Case study viewer coming soon!', 'info');
        });
    });
}

async function handleSaveProject(btn) {
    const user = getCurrentUser();

    // Check if user is authenticated
    if (!user) {
        showToast('Please sign in to save projects', 'error');
        document.getElementById('authModal') ?.classList.add('active');
        return;
    }

    const projectId = btn.getAttribute('data-project-id');
    const isSaved = btn.classList.contains('saved');

    // Get project data from the card
    const projectCard = btn.closest('.project-card');
    const projectTitle = projectCard.querySelector('.project-title') ?.textContent;
    const projectDescription = projectCard.querySelector('.project-description') ?.textContent;
    const projectImage = projectCard.querySelector('.project-image img') ?.src;

    try {
        if (isSaved) {
            // Unsave project
            await unsaveProject(user.uid, projectId);
            btn.classList.remove('saved');
            savedProjectsCache.delete(projectId);
        } else {
            // Save project
            await saveProject(user.uid, projectId, {
                title: projectTitle,
                description: projectDescription,
                image: projectImage
            });
            btn.classList.add('saved');
            savedProjectsCache.add(projectId);
        }
    } catch (error) {
        console.error('Error toggling save state:', error);
    }
}

function viewProjectDetails(projectId) {
    showToast('Project details viewer coming soon!', 'info');
    console.log('Viewing project:', projectId);
}

// ================================
// Hero Animations
// ================================

function initHeroAnimations() {
    // Animate counter numbers
    const statNumbers = document.querySelectorAll('.stat-number');

    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                animateCounter(entry.target, target);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    statNumbers.forEach(num => observer.observe(num));
}

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 50;
    const duration = 2000;
    const stepTime = duration / 50;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target + '+';
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, stepTime);
}

// ================================
// Scroll Effects
// ================================

function initScrollEffects() {
    const scrollTopBtn = document.getElementById('scrollTopBtn');

    // Show/hide scroll to top button
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 500) {
            scrollTopBtn ?.classList.add('show');
        } else {
            scrollTopBtn ?.classList.remove('show');
        }
    });

    // Scroll to top on click
    scrollTopBtn ?.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for fade-in
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        fadeObserver.observe(section);
    });
}

// ================================
// Contact Form
// ================================

function initContactForm() {
    const contactForm = document.getElementById('contactForm');

    contactForm ?.addEventListener('submit', async(e) => {
        e.preventDefault();

        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value
        };

        console.log('Contact form submitted:', formData);

        // Here you would typically send this to a backend or Firebase Function
        showToast('Message sent successfully! We\'ll get back to you soon.');
        contactForm.reset();
    });
}

// ================================
// Utility Functions
// ================================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = toast ?.querySelector('i');

    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.classList.remove('error');

        if (type === 'error') {
            toast.classList.add('error');
            if (toastIcon) {
                toastIcon.className = 'fas fa-exclamation-circle';
            }
        } else if (type === 'info') {
            if (toastIcon) {
                toastIcon.className = 'fas fa-info-circle';
            }
        } else {
            if (toastIcon) {
                toastIcon.className = 'fas fa-check-circle';
            }
        }

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Make showToast globally available
window.showToast = showToast;

// ================================
// Export functions for external use
// ================================

export { showToast, applyTheme };
