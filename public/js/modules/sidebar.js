/**
 * Sidebar Management
 * Handles sidebar interactions, user lists, and room management
 */

import { dom } from './dom.js';
import { Utils } from './utils.js';

export class Sidebar {
    constructor() {
        this.activeChat = { type: null, id: null, name: null, creator: null };
        this.allUsers = [];
        this.currentRoomMembers = [];
        this.onlineUsers = {};
        this.typingUsers = {};
        this.isDesktopSidebarCollapsed = false;
        
        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners for sidebar
     */
    initializeEventListeners() {
        // Mobile menu toggle
        if (dom.elements.mobileMenuToggle) {
            dom.elements.mobileMenuToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Sidebar overlay click
        if (dom.elements.sidebarOverlay) {
            dom.elements.sidebarOverlay.addEventListener('click', () => {
                this.closeSidebar();
            });
        }

        // Sidebar click handler for chat selection
        if (dom.elements.sidebar) {
            dom.elements.sidebar.addEventListener('click', (e) => {
                this.handleSidebarClick(e);
            });
        }

        // Desktop sidebar toggle
        if (dom.elements.desktopSidebarToggle) {
            dom.elements.desktopSidebarToggle.addEventListener('click', () => {
                this.toggleDesktopSidebar();
            });
        }

        // Theme toggle
        if (dom.elements.themeToggleBtn) {
            dom.elements.themeToggleBtn.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    /**
     * Toggle sidebar visibility on mobile
     */
    toggleSidebar() {
        if (dom.elements.sidebar) {
            dom.elements.sidebar.classList.toggle('-translate-x-full');
        }
        if (dom.elements.sidebarOverlay) {
            dom.elements.sidebarOverlay.classList.toggle('hidden');
        }
    }

    /**
     * Close sidebar on mobile
     */
    closeSidebar() {
        if (dom.elements.sidebar) {
            dom.elements.sidebar.classList.add('-translate-x-full');
        }
        if (dom.elements.sidebarOverlay) {
            dom.elements.sidebarOverlay.classList.add('hidden');
        }
    }

    /**
     * Toggle desktop sidebar
     */
    toggleDesktopSidebar() {
        if (!dom.elements.sidebar) return;
        
        this.isDesktopSidebarCollapsed = !this.isDesktopSidebarCollapsed;
        
        if (this.isDesktopSidebarCollapsed) {
            dom.elements.sidebar.classList.add('-translate-x-full');
            this.updateSidebarToggleIcon(true);
        } else {
            dom.elements.sidebar.classList.remove('-translate-x-full');
            this.updateSidebarToggleIcon(false);
        }
        
        // Save state to localStorage
        localStorage.setItem('sidebarCollapsed', this.isDesktopSidebarCollapsed);
    }

    /**
     * Update sidebar toggle icon
     */
    updateSidebarToggleIcon(isCollapsed) {
        if (!dom.elements.sidebarToggleIcon) return;
        
        if (isCollapsed) {
            // Show arrow pointing right (expand)
            dom.elements.sidebarToggleIcon.innerHTML = `
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            `;
        } else {
            // Show hamburger menu (collapse)
            dom.elements.sidebarToggleIcon.innerHTML = `
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            `;
        }
    }

    /**
     * Initialize sidebar state from localStorage
     */
    initializeSidebarState() {
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState === 'true') {
            this.isDesktopSidebarCollapsed = true;
            if (dom.elements.sidebar) {
                dom.elements.sidebar.classList.add('-translate-x-full');
            }
            this.updateSidebarToggleIcon(true);
        }
    }

    /**
     * Handle sidebar click events
     * @param {Event} e - Click event
     */
    handleSidebarClick(e) {
        const chatButton = e.target.closest('button[data-chat-type]');
        if (!chatButton) return;
        
        // Clear unread indicator
        const indicator = chatButton.querySelector('.unread-indicator');
        if (indicator) {
            indicator.classList.add('hidden');
        }

        const { chatType, id, name, creator } = chatButton.dataset;
        this.activeChat = { type: chatType, id, name, creator };

        // Update active state
        this.updateActiveChatState(chatButton);
        
        // Emit chat selection event
        this.emitChatSelected(this.activeChat);
        
        // Close sidebar on mobile
        this.closeSidebar();
    }

    /**
     * Update active chat state in UI
     * @param {Element} activeButton - The active chat button
     */
    updateActiveChatState(activeButton) {
        // Remove active state from all buttons
        document.querySelectorAll('[data-chat-type]').forEach(btn => {
            btn.classList.remove('bg-indigo-50', 'dark:bg-indigo-900/20', 'border-indigo-200', 'dark:border-indigo-700');
        });
        
        // Add active state to selected button
        activeButton.classList.add('bg-indigo-50', 'dark:bg-indigo-900/20', 'border-indigo-200', 'dark:border-indigo-700');
    }

    /**
     * Emit chat selected event
     * @param {Object} chatData - Chat data
     */
    emitChatSelected(chatData) {
        const event = new CustomEvent('chatSelected', { detail: chatData });
        document.dispatchEvent(event);
    }

    /**
     * Load and render rooms
     */
    async loadRooms() {
        try {
            const response = await fetch('/api/rooms');
            if (!response.ok) throw new Error('Failed to load rooms');
            
            const rooms = await response.json();
            this.renderRooms(rooms);
        } catch (error) {
            console.error('Failed to load rooms:', error);
            this.showError('Failed to load rooms');
        }
    }

    /**
     * Render rooms in sidebar
     * @param {Array} rooms - Array of room objects
     */
    renderRooms(rooms) {
        if (!dom.elements.roomList) return;
        
        dom.elements.roomList.innerHTML = '';
        
        rooms.forEach(room => {
            const roomElement = this.createRoomElement(room);
            dom.elements.roomList.appendChild(roomElement);
        });
    }

    /**
     * Create room element
     * @param {Object} room - Room object
     * @returns {Element} Room element
     */
    createRoomElement(room) {
        const roomElement = document.createElement('button');
        roomElement.className = 'flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200 w-full text-left border border-transparent';
        roomElement.dataset.chatType = 'room';
        roomElement.dataset.id = room._id;
        roomElement.dataset.name = room.name;
        roomElement.dataset.creator = room.creator;
        
        roomElement.innerHTML = `
            <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold shadow-lg">
                #
            </div>
            <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                    ${Utils.escapeHtml(room.name)}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                    Group chat
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <span class="unread-indicator hidden w-2 h-2 bg-indigo-500 rounded-full"></span>
            </div>
        `;
        
        return roomElement;
    }

    /**
     * Fetch all users
     */
    async fetchAllUsers() {
        try {
            const response = await fetch('/api/users');
            if (!response.ok) throw new Error('Failed to fetch users');
            
            this.allUsers = await response.json();
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    }

    /**
     * Update user status (online/offline)
     * @param {Object} onlineUsers - Object of online users
     */
    updateUserStatus(onlineUsers) {
        this.onlineUsers = onlineUsers;
        this.renderUsers(onlineUsers);
        this.updateOnlineCount(onlineUsers);
    }

    /**
     * Render users in sidebar
     * @param {Object} onlineUsers - Object of online users
     */
    renderUsers(onlineUsers) {
        if (!dom.elements.userList) return;
        
        dom.elements.userList.innerHTML = '';
        
        const users = Object.values(onlineUsers).filter(u => u.username !== dom.elements.currentUsername);
        
        users.forEach(user => {
            const userId = Object.keys(onlineUsers).find(key => onlineUsers[key] === user);
            const userElement = this.createUserElement(user, userId);
            dom.elements.userList.appendChild(userElement);
        });
    }

    /**
     * Create user element
     * @param {Object} user - User object
     * @param {string} userId - User ID
     * @returns {Element} User element
     */
    createUserElement(user, userId) {
        const userElement = document.createElement('button');
        userElement.className = 'flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200 w-full text-left border border-transparent';
        userElement.dataset.chatType = 'dm';
        userElement.dataset.id = userId;
        userElement.dataset.name = user.username;
        
        const avatarGradient = Utils.getAvatarGradient(user.username);
        const initial = user.username.charAt(0).toUpperCase();
        
        userElement.innerHTML = `
            <div class="relative">
                <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${avatarGradient} text-white font-semibold shadow-lg">
                    ${initial}
                </div>
                <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
            </div>
            <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                    ${Utils.escapeHtml(user.username)}
                </div>
                <div class="text-xs text-green-500 font-medium">
                    Online
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <span class="unread-indicator hidden w-2 h-2 bg-indigo-500 rounded-full"></span>
            </div>
        `;
        
        return userElement;
    }

    /**
     * Update online user count
     * @param {Object} onlineUsers - Object of online users
     */
    updateOnlineCount(onlineUsers) {
        if (dom.elements.onlineUserCount) {
            const count = Object.keys(onlineUsers).length - 1; // Exclude current user
            dom.elements.onlineUserCount.textContent = count;
        }
    }

    /**
     * Show unread indicator for chat
     * @param {string} chatId - Chat ID
     * @param {string} chatType - Chat type (dm or room)
     */
    showUnreadIndicator(chatId, chatType) {
        const chatButton = document.querySelector(`button[data-chat-type="${chatType}"][data-id="${chatId}"]`);
        if (chatButton) {
            const indicator = chatButton.querySelector('.unread-indicator');
            if (indicator) {
                indicator.classList.remove('hidden');
            }
        }
    }

    /**
     * Hide unread indicator for chat
     * @param {string} chatId - Chat ID
     * @param {string} chatType - Chat type (dm or room)
     */
    hideUnreadIndicator(chatId, chatType) {
        const chatButton = document.querySelector(`button[data-chat-type="${chatType}"][data-id="${chatId}"]`);
        if (chatButton) {
            const indicator = chatButton.querySelector('.unread-indicator');
            if (indicator) {
                indicator.classList.add('hidden');
            }
        }
    }

    /**
     * Toggle theme
     */
    toggleTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
        
        this.updateThemeIcon();
    }

    /**
     * Update theme icon
     */
    updateThemeIcon() {
        const isDark = document.documentElement.classList.contains('dark');
        
        if (dom.elements.themeIconSun && dom.elements.themeIconMoon) {
            if (isDark) {
                dom.elements.themeIconSun.classList.add('hidden');
                dom.elements.themeIconMoon.classList.remove('hidden');
            } else {
                dom.elements.themeIconSun.classList.remove('hidden');
                dom.elements.themeIconMoon.classList.add('hidden');
            }
        }
    }

    /**
     * Initialize theme from localStorage
     */
    initializeTheme() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.classList.add('dark');
        }
        
        this.updateThemeIcon();
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    /**
     * Get active chat data
     * @returns {Object} Active chat data
     */
    getActiveChat() {
        return this.activeChat;
    }

    /**
     * Set active chat data
     * @param {Object} chatData - Chat data
     */
    setActiveChat(chatData) {
        this.activeChat = chatData;
    }
}

export const sidebar = new Sidebar();
