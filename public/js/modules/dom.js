/**
 * DOM Elements and Utilities
 * Centralized DOM element references and utility functions
 */

export class DOM {
    constructor() {
        this.elements = {};
        this.initializeElements();
    }

    initializeElements() {
        // User data
        this.elements.currentUserId = document.getElementById('current-user-id')?.value;
        this.elements.currentUsername = document.getElementById('current-user-username')?.value;

        // Chat elements
        this.elements.chatHeader = document.getElementById('chat-header');
        this.elements.headerAvatar = document.getElementById('header-avatar');
        this.elements.headerUsername = document.getElementById('header-username');
        this.elements.headerStatus = document.getElementById('header-status');
        this.elements.headerStatusIndicator = document.getElementById('header-status-indicator');
        this.elements.chatMessages = document.getElementById('chat-messages');
        this.elements.messageInput = document.getElementById('message-input');
        this.elements.sendBtn = document.getElementById('send-btn');
        this.elements.typingIndicator = document.getElementById('typing-indicator');
        this.elements.loadingMessages = document.getElementById('loading-messages');

        // Sidebar elements
        this.elements.userList = document.getElementById('user-list');
        this.elements.onlineUserCount = document.getElementById('online-user-count');
        this.elements.contactsList = document.getElementById('contacts-list');
        this.elements.contactsCount = document.getElementById('contacts-count');
        this.elements.roomList = document.getElementById('room-list');
        this.elements.sidebar = document.getElementById('sidebar');
        this.elements.sidebarOverlay = document.getElementById('sidebar-overlay');
        this.elements.mobileMenuToggle = document.getElementById('mobile-menu-toggle');

        // Modal elements
        this.elements.createRoomBtn = document.getElementById('create-room-btn');
        this.elements.createRoomModal = document.getElementById('create-room-modal');
        this.elements.createRoomForm = document.getElementById('create-room-form');
        this.elements.roomNameInput = document.getElementById('room-name-input');
        this.elements.roomError = document.getElementById('room-error');
        this.elements.closeModalBtn = document.getElementById('close-modal-btn');
        this.elements.closeModalBtn2 = document.getElementById('close-modal-btn-2');

        this.elements.addMemberBtn = document.getElementById('add-member-btn');
        this.elements.addMemberModal = document.getElementById('add-member-modal');
        this.elements.addMemberUserList = document.getElementById('add-member-user-list');
        this.elements.closeAddMemberModalBtn = document.getElementById('close-add-member-modal-btn');
        this.elements.closeAddMemberModalBtn2 = document.getElementById('close-add-member-modal-btn-2');

        // Room management elements
        this.elements.roomManagementBtn = document.getElementById('room-management-btn');
        this.elements.roomManagementModal = document.getElementById('room-management-modal');
        this.elements.roomMembersList = document.getElementById('room-members-list');
        this.elements.deleteRoomBtn = document.getElementById('delete-room-btn');
        this.elements.deleteRoomConfirmationModal = document.getElementById('delete-room-confirmation-modal');
        this.elements.confirmDeleteRoomBtn = document.getElementById('confirm-delete-room-btn');
        this.elements.cancelDeleteRoomBtn = document.getElementById('cancel-delete-room-btn');
        this.elements.cancelRoomManagementBtn = document.getElementById('cancel-room-management-btn');
        this.elements.closeRoomManagementModalBtn = document.getElementById('close-room-management-modal-btn');

        // Theme elements
        this.elements.themeToggleBtn = document.getElementById('theme-toggle-btn');
        this.elements.themeIconSun = document.getElementById('theme-icon-sun');
        this.elements.themeIconMoon = document.getElementById('theme-icon-moon');

        // Desktop sidebar toggle
        this.elements.desktopSidebarToggle = document.getElementById('desktop-sidebar-toggle');
        this.elements.sidebarToggleIcon = document.getElementById('sidebar-toggle-icon');

        // Welcome message and chat container
        this.elements.welcomeMessage = document.getElementById('welcome-message');
        this.elements.chatContainer = document.getElementById('chat-container');
    }

    // Utility functions
    showElement(element, display = 'block') {
        if (element) {
            element.classList.remove('hidden');
            element.style.display = display;
        }
    }

    hideElement(element) {
        if (element) {
            element.classList.add('hidden');
        }
    }

    toggleElement(element) {
        if (element) {
            element.classList.toggle('hidden');
        }
    }

    addClass(element, className) {
        if (element) {
            element.classList.add(className);
        }
    }

    removeClass(element, className) {
        if (element) {
            element.classList.remove(className);
        }
    }

    setText(element, text) {
        if (element) {
            element.textContent = text;
        }
    }

    setHTML(element, html) {
        if (element) {
            element.innerHTML = html;
        }
    }

    // Auto-resize textarea
    autoResizeTextarea(textarea) {
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        }
    }

    // Scroll to bottom of messages
    scrollToBottom(element) {
        if (element) {
            element.scrollTop = element.scrollHeight;
        }
    }

    // Show loading state
    showLoading(element) {
        if (element) {
            this.addClass(element, 'opacity-50');
            this.addClass(element, 'pointer-events-none');
        }
    }

    // Hide loading state
    hideLoading(element) {
        if (element) {
            this.removeClass(element, 'opacity-50');
            this.removeClass(element, 'pointer-events-none');
        }
    }

    // Show error message
    showError(element, message) {
        if (element) {
            this.setText(element, message);
            this.removeClass(element, 'hidden');
            setTimeout(() => {
                this.addClass(element, 'hidden');
            }, 5000);
        }
    }

    // Clear error message
    clearError(element) {
        if (element) {
            this.setText(element, '');
            this.addClass(element, 'hidden');
        }
    }
}

export const dom = new DOM();
