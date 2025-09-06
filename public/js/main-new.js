/**
 * Main Application Entry Point
 * Coordinates all modules and initializes the chat application
 */

import { dom } from './modules/dom.js';
import { Utils } from './modules/utils.js';
import { messageRenderer } from './modules/messageRenderer.js';
import { sidebar } from './modules/sidebar.js';
import { MessageHandler } from './modules/messageHandler.js';
import { ModalHandler } from './modules/modalHandler.js';

class ChatApp {
    constructor() {
        this.socket = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the chat application
     */
    async init() {
        try {
            // Initialize Socket.IO connection
            this.socket = io();
            
            // Initialize theme
            sidebar.initializeTheme();
            
            // Initialize sidebar state
            sidebar.initializeSidebarState();
            
            // Initialize message handler with socket
            this.messageHandler = new MessageHandler(this.socket);
            
            // Initialize modal handler
            this.modalHandler = new ModalHandler();
            
            // Set up global state
            window.activeChat = sidebar.getActiveChat();
            
            // Load initial data
            await this.loadInitialData();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize message pagination
            this.initializeMessagePagination();
            
            // Show welcome message by default
            this.messageHandler.showWelcomeMessage();
            
            this.isInitialized = true;
            console.log('Chat application initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize chat application:', error);
            this.showError('Failed to initialize chat application');
        }
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            // Load rooms and users in parallel
            await Promise.all([
                sidebar.loadRooms(),
                sidebar.fetchAllUsers()
            ]);
        } catch (error) {
            console.error('Failed to load initial data:', error);
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for room created events
        document.addEventListener('roomCreated', (e) => {
            sidebar.loadRooms();
        });

        // Listen for window resize to handle responsive behavior
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 250));

        // Listen for online/offline status
        window.addEventListener('online', () => {
            this.showSuccess('Connection restored');
        });

        window.addEventListener('offline', () => {
            this.showError('Connection lost');
        });

        // Listen for beforeunload to clean up
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    /**
     * Initialize message pagination
     */
    initializeMessagePagination() {
        if (dom.elements.chatMessages) {
            dom.elements.chatMessages.addEventListener('scroll', Utils.throttle((e) => {
                this.handleScroll(e);
            }, 100));
        }
    }

    /**
     * Handle scroll for message pagination
     * @param {Event} e - Scroll event
     */
    handleScroll(e) {
        const element = e.target;
        const activeChat = sidebar.getActiveChat();
        
        // Check if scrolled to top
        if (element.scrollTop === 0 && activeChat.id) {
            this.loadOlderMessages(activeChat);
        }
    }

    /**
     * Load older messages for pagination
     * @param {Object} activeChat - Active chat data
     */
    async loadOlderMessages(activeChat) {
        const firstMessage = dom.elements.chatMessages?.querySelector('.message-item');
        if (!firstMessage) return;

        const lastMessageId = firstMessage.dataset.messageId;
        if (!lastMessageId) return;

        try {
            await this.messageHandler.loadOlderMessages(
                activeChat.id, 
                activeChat.type, 
                lastMessageId
            );
        } catch (error) {
            console.error('Failed to load older messages:', error);
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Close sidebar on mobile when resizing to desktop
        if (window.innerWidth >= 1024) {
            sidebar.closeSidebar();
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in';
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('animate-fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in';
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('animate-fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new ChatApp();
    app.init();
    
    // Make app globally available for debugging
    window.chatApp = app;
});
