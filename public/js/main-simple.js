/**
 * Simplified Main Application
 * A refactored version of the original main.js with improved structure and features
 */

document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // Get user data
    const currentUserId = document.getElementById('current-user-id')?.value;
    const currentUsername = document.getElementById('current-user-username')?.value;

    // DOM Elements
    const chatHeader = document.getElementById('chat-header');
    const headerAvatar = document.getElementById('header-avatar');
    const headerUsername = document.getElementById('header-username');
    const headerStatus = document.getElementById('header-status');
    const headerStatusIndicator = document.getElementById('header-status-indicator');
    const userList = document.getElementById('user-list');
    const onlineUserCount = document.getElementById('online-user-count');
    const contactsList = document.getElementById('contacts-list');
    const contactsCount = document.getElementById('contacts-count');
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const roomList = document.getElementById('room-list');
    const createRoomBtn = document.getElementById('create-room-btn');
    const createRoomModal = document.getElementById('create-room-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const closeModalBtn2 = document.getElementById('close-modal-btn-2');
    const createRoomForm = document.getElementById('create-room-form');
    const roomNameInput = document.getElementById('room-name-input');
    const roomError = document.getElementById('room-error');
    const addMemberBtn = document.getElementById('add-member-btn');
    const addMemberModal = document.getElementById('add-member-modal');
    const addMemberUserList = document.getElementById('add-member-user-list');
    const closeAddMemberModalBtn = document.getElementById('close-add-member-modal-btn');
    const closeAddMemberModalBtn2 = document.getElementById('close-add-member-modal-btn-2');
    
    // Room management elements
    const roomManagementBtn = document.getElementById('room-management-btn');
    const roomManagementModal = document.getElementById('room-management-modal');
    const roomMembersList = document.getElementById('room-members-list');
    const deleteRoomBtn = document.getElementById('delete-room-btn');
    const deleteRoomConfirmationModal = document.getElementById('delete-room-confirmation-modal');
    const confirmDeleteRoomBtn = document.getElementById('confirm-delete-room-btn');
    const cancelDeleteRoomBtn = document.getElementById('cancel-delete-room-btn');
    const cancelRoomManagementBtn = document.getElementById('cancel-room-management-btn');
    const closeRoomManagementModalBtn = document.getElementById('close-room-management-modal-btn');
    
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeIconSun = document.getElementById('theme-icon-sun');
    const themeIconMoon = document.getElementById('theme-icon-moon');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const desktopSidebarToggle = document.getElementById('desktop-sidebar-toggle');
    const sidebarToggleIcon = document.getElementById('sidebar-toggle-icon');
    const typingIndicator = document.getElementById('typing-indicator');
    const loadingMessages = document.getElementById('loading-messages');
    const welcomeMessage = document.getElementById('welcome-message');
    const chatContainer = document.getElementById('chat-container');
    const messageInputBar = document.getElementById('message-input-bar');

    // State
    let activeChat = { type: null, id: null, name: null, creator: null };
    let allUsers = [];
    let currentRoomMembers = [];
    let isTyping = false;
    let typingTimeout = null;
    let lastMessageDate = null;
    let isDesktopSidebarCollapsed = false;
    let contacts = new Map(); // Store contacts with their last message info
    let onlineUsers = {}; // Store online users for status checking

    // Utility functions
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatMessageTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getAvatarGradient = (username) => {
        const gradients = [
            'from-red-500 to-pink-500',
            'from-blue-500 to-indigo-500',
            'from-green-500 to-teal-500',
            'from-yellow-500 to-orange-500',
            'from-purple-500 to-pink-500',
            'from-pink-500 to-rose-500',
            'from-indigo-500 to-purple-500',
            'from-teal-500 to-cyan-500'
        ];
        const index = username.charCodeAt(0) % gradients.length;
        return gradients[index];
    };

    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    const autoResizeTextarea = (textarea) => {
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        }
    };

    const scrollToBottom = (element) => {
        if (element) {
            // Find the scrollable messages area
            const scrollArea = element.closest('.messages-scroll-area') || element;
            if (scrollArea) {
                scrollArea.scrollTop = scrollArea.scrollHeight;
            }
        }
    };

    // Mobile sidebar functions
    const toggleSidebar = () => {
        if (sidebar) {
            sidebar.classList.toggle('-translate-x-full');
        }
        if (sidebarOverlay) {
            sidebarOverlay.classList.toggle('hidden');
        }
    };

    const closeSidebar = () => {
        if (sidebar) {
            sidebar.classList.add('-translate-x-full');
        }
        if (sidebarOverlay) {
            sidebarOverlay.classList.add('hidden');
        }
    };

    // Desktop sidebar toggle functions
    const toggleDesktopSidebar = () => {
        if (!sidebar) return;
        
        isDesktopSidebarCollapsed = !isDesktopSidebarCollapsed;
        
        if (isDesktopSidebarCollapsed) {
            sidebar.classList.add('-translate-x-full');
            updateSidebarToggleIcon(true);
        } else {
            sidebar.classList.remove('-translate-x-full');
            updateSidebarToggleIcon(false);
        }
        
        // Save state to localStorage
        localStorage.setItem('sidebarCollapsed', isDesktopSidebarCollapsed);
    };

    const updateSidebarToggleIcon = (isCollapsed) => {
        if (!sidebarToggleIcon) return;
        
        if (isCollapsed) {
            // Show arrow pointing right (expand)
            sidebarToggleIcon.innerHTML = `
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            `;
        } else {
            // Show hamburger menu (collapse)
            sidebarToggleIcon.innerHTML = `
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            `;
        }
    };

    const initializeSidebarState = () => {
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState === 'true') {
            isDesktopSidebarCollapsed = true;
            if (sidebar) {
                sidebar.classList.add('-translate-x-full');
            }
            updateSidebarToggleIcon(true);
        }
    };

    // Welcome message and chat container management
    const showWelcomeMessage = () => {
        if (welcomeMessage) {
            welcomeMessage.classList.remove('hidden');
        }
        if (chatContainer) {
            chatContainer.classList.add('hidden');
        }
        if (chatHeader) {
            chatHeader.classList.add('hidden');
        }
        if (messageInputBar) {
            messageInputBar.classList.add('hidden');
        }
        if (typingIndicator) {
            typingIndicator.classList.add('hidden');
        }
    };

    const hideWelcomeMessage = () => {
        if (welcomeMessage) {
            welcomeMessage.classList.add('hidden');
        }
        if (chatContainer) {
            chatContainer.classList.remove('hidden');
        }
        if (chatHeader) {
            chatHeader.classList.remove('hidden');
        }
        if (messageInputBar) {
            messageInputBar.classList.remove('hidden');
        }
        if (typingIndicator) {
            typingIndicator.classList.add('hidden'); // hide residual typing text on chat switch
            typingIndicator.innerHTML = '';
            typingIndicator.classList.remove('hidden'); // show the bar area only after chat opens
        }
    };

    // Contacts management functions
    const addToContacts = (userId, username, lastMessage = null) => {
        if (userId === currentUserId) return; // Don't add self to contacts
        
        contacts.set(userId, {
            id: userId,
            username: username,
            lastMessage: lastMessage,
            lastMessageTime: lastMessage ? new Date() : null
        });
        
        renderContacts();
    };

    const updateContactLastMessage = (userId, message) => {
        if (contacts.has(userId)) {
            const contact = contacts.get(userId);
            contact.lastMessage = message;
            contact.lastMessageTime = new Date();
            contacts.set(userId, contact);
            renderContacts();
        }
    };

    const renderContacts = () => {
        if (!contactsList) return;
        
        contactsList.innerHTML = '';
        
        // Sort contacts by last message time (most recent first)
        const sortedContacts = Array.from(contacts.values()).sort((a, b) => {
            if (!a.lastMessageTime && !b.lastMessageTime) return 0;
            if (!a.lastMessageTime) return 1;
            if (!b.lastMessageTime) return -1;
            return b.lastMessageTime - a.lastMessageTime;
        });
        
        sortedContacts.forEach(contact => {
            const contactElement = createContactElement(contact);
            contactsList.appendChild(contactElement);
        });
        
        // Update contacts count
        if (contactsCount) {
            contactsCount.textContent = contacts.size;
        }
    };

    const createContactElement = (contact) => {
        const contactElement = document.createElement('button');
        contactElement.className = 'flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200 w-full text-left border border-transparent';
        contactElement.dataset.chatType = 'dm';
        contactElement.dataset.id = contact.id;
        contactElement.dataset.name = contact.username;
        
        const avatarGradient = getAvatarGradient(contact.username);
        const initial = contact.username.charAt(0).toUpperCase();
        
        // Check if user is currently online
        const isOnline = Object.keys(onlineUsers || {}).includes(contact.id);
        
        contactElement.innerHTML = `
            <div class="relative">
                <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${avatarGradient} text-white font-semibold shadow-lg">
                    ${initial}
                </div>
                ${isOnline ? `
                    <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                ` : ''}
            </div>
            <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                    ${escapeHtml(contact.username)}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                    ${contact.lastMessage ? escapeHtml(contact.lastMessage) : 'No messages yet'}
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <span class="unread-indicator hidden w-2 h-2 bg-indigo-500 rounded-full"></span>
            </div>
        `;
        
        return contactElement;
    };

    const loadContactsFromMessages = async () => {
        try {
            // This would ideally fetch from an API endpoint that returns users with message history
            // For now, we'll populate contacts when users interact
            // In a real implementation, you'd have an endpoint like /api/contacts
        } catch (error) {
            console.error('Failed to load contacts:', error);
        }
    };

    // Room management functions
    const openRoomManagement = async () => {
        if (activeChat.type !== 'room') return;
        
        try {
            // Load room members
            await loadRoomMembers();
            
            // Show room management modal
            if (roomManagementModal) {
                roomManagementModal.classList.remove('hidden');
                // Add animation
                setTimeout(() => {
                    const modalContent = roomManagementModal.querySelector('.bg-white, .dark\\:bg-slate-800');
                    if (modalContent) {
                        modalContent.style.transform = 'scale(1)';
                        modalContent.style.opacity = '1';
                    }
                }, 10);
            }
        } catch (error) {
            console.error('Failed to open room management:', error);
        }
    };

    const closeRoomManagement = () => {
        if (roomManagementModal) {
            roomManagementModal.classList.add('hidden');
        }
    };

    const loadRoomMembers = async () => {
        if (!roomMembersList || activeChat.type !== 'room') return;
        
        try {
            // Fetch room details to get members
            const response = await fetch(`/api/rooms`);
            if (!response.ok) throw new Error('Failed to load rooms');
            
            const rooms = await response.json();
            const currentRoom = rooms.find(room => room._id === activeChat.id);
            
            if (!currentRoom) return;
            
            // Clear existing members
            roomMembersList.innerHTML = '';
            
            // Add each member
            for (const memberId of currentRoom.members) {
                const user = allUsers.find(u => u._id === memberId);
                if (user) {
                    const memberElement = createMemberElement(user, currentRoom.creator === memberId);
                    roomMembersList.appendChild(memberElement);
                }
            }
        } catch (error) {
            console.error('Failed to load room members:', error);
        }
    };

    const createMemberElement = (user, isCreator) => {
        const memberElement = document.createElement('div');
        memberElement.className = 'flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg';
        
        const avatarGradient = getAvatarGradient(user.username);
        const initial = user.username.charAt(0).toUpperCase();
        
        memberElement.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br ${avatarGradient} text-white font-semibold text-sm">
                    ${initial}
                </div>
                <div>
                    <div class="text-sm font-medium text-gray-800 dark:text-gray-200">
                        ${escapeHtml(user.username)}
                        ${isCreator ? '<span class="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full">Creator</span>' : ''}
                    </div>
                </div>
            </div>
            ${!isCreator ? `
                <button class="remove-member-btn p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors duration-200" data-user-id="${user._id}" data-username="${user.username}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            ` : ''}
        `;
        
        return memberElement;
    };

    const removeMember = async (userId, username) => {
        if (!confirm(`Are you sure you want to remove ${username} from this room?`)) {
            return;
        }
        
        try {
            const response = await fetch(`/api/rooms/${activeChat.id}/members/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to remove member');
            }
            
            // Reload room members
            await loadRoomMembers();
            
            // Show success message
            console.log(`${username} has been removed from the room`);
        } catch (error) {
            console.error('Failed to remove member:', error);
            alert('Failed to remove member: ' + error.message);
        }
    };

    const deleteRoom = async () => {
        try {
            const response = await fetch(`/api/rooms/${activeChat.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete room');
            }
            
            // Close modals
            closeRoomManagement();
            if (deleteRoomConfirmationModal) {
                deleteRoomConfirmationModal.classList.add('hidden');
            }
            
            // Clear active chat and show welcome message
            activeChat = { type: null, id: null, name: null, creator: null };
            showWelcomeMessage();
            
            // Reload rooms
            await loadRooms();
            
            console.log('Room deleted successfully');
        } catch (error) {
            console.error('Failed to delete room:', error);
            alert('Failed to delete room: ' + error.message);
        }
    };

    // Theme functions
    const updateThemeIcon = () => {
        const isDark = document.documentElement.classList.contains('dark');
        if (themeIconSun && themeIconMoon) {
            if (isDark) {
                themeIconSun.classList.add('hidden');
                themeIconMoon.classList.remove('hidden');
            } else {
                themeIconSun.classList.remove('hidden');
                themeIconMoon.classList.add('hidden');
            }
        }
    };

    const toggleTheme = () => {
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
        updateThemeIcon();
    };

    // Message rendering functions
    const shouldShowDateSeparator = (timestamp) => {
        if (!lastMessageDate) {
            lastMessageDate = new Date(timestamp);
            return true;
        }
        
        const currentDate = new Date(timestamp);
        const lastDate = new Date(lastMessageDate);
        
        const isDifferentDate = currentDate.toDateString() !== lastDate.toDateString();
        
        if (isDifferentDate) {
            lastMessageDate = currentDate;
            return true;
        }
        
        return false;
    };

    const createDateSeparator = (timestamp) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        let dateText;
        if (date.toDateString() === today.toDateString()) {
            dateText = 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            dateText = 'Yesterday';
        } else {
            dateText = date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
        return `
            <div class="flex items-center justify-center my-6">
                <div class="flex-1 h-px bg-gray-200 dark:bg-slate-600"></div>
                <span class="px-4 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 rounded-full">
                    ${dateText}
                </span>
                <div class="flex-1 h-px bg-gray-200 dark:bg-slate-600"></div>
            </div>
        `;
    };

    const outputMessage = (message) => {
        const senderId = message.sender._id || message.sender.id;
        const isCurrentUser = senderId === currentUserId;
        const timestamp = message.createdAt || new Date();
        
        // Check if we need to show date separator
        const shouldShowDate = shouldShowDateSeparator(timestamp);
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message-item animate-fade-in';
        
        let messageHTML = '';
        
        // Add date separator if needed
        if (shouldShowDate) {
            messageHTML += createDateSeparator(timestamp);
        }
        
        // Add message content
        const timeString = formatMessageTime(timestamp);
        const avatarGradient = getAvatarGradient(message.sender.username);
        
        const alignment = isCurrentUser ? 'justify-end' : 'justify-start';
        const messageBg = isCurrentUser 
            ? 'bg-indigo-500 text-white' 
            : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-slate-600';
        
        messageHTML += `
            <div class="flex ${alignment} mb-4 group">
                <div class="flex items-end space-x-2 max-w-xs lg:max-w-md xl:max-w-lg">
                    ${!isCurrentUser ? `
                        <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                            ${message.sender.username.charAt(0).toUpperCase()}
                        </div>
                    ` : ''}
                    
                    <div class="flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}">
                        ${!isCurrentUser ? `
                            <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 px-1">
                                ${escapeHtml(message.sender.username)}
                            </div>
                        ` : ''}
                        
                        <div class="relative">
                            <div class="px-4 py-2 rounded-2xl ${messageBg} shadow-sm hover:shadow-md transition-shadow duration-200">
                                <div class="text-sm leading-relaxed break-words">${escapeHtml(message.content)}</div>
                            </div>
                            
                            <div class="absolute ${isCurrentUser ? '-left-16' : '-right-16'} top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <span class="text-xs text-gray-400 dark:text-gray-500 ${isCurrentUser ? 'text-right' : 'text-left'} whitespace-nowrap">
                                    ${timeString}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    ${isCurrentUser ? `
                        <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                            ${message.sender.username.charAt(0).toUpperCase()}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        messageElement.innerHTML = messageHTML;
        chatMessages.appendChild(messageElement);
        
        // Scroll to bottom of the messages scroll area
        const messagesScrollArea = document.querySelector('.messages-scroll-area');
        if (messagesScrollArea) {
            messagesScrollArea.scrollTop = messagesScrollArea.scrollHeight;
        }
    };

    // Data fetching functions
    const loadRooms = async () => {
        try {
            const response = await fetch('/api/rooms');
            if (!response.ok) throw new Error('Failed to load rooms');
            
            const rooms = await response.json();
            roomList.innerHTML = '';
            
            rooms.forEach(room => {
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
                            ${escapeHtml(room.name)}
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                            Group chat
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="unread-indicator hidden w-2 h-2 bg-indigo-500 rounded-full"></span>
                    </div>
                `;
                
                roomList.appendChild(roomElement);
            });
        } catch (error) {
            console.error('Failed to load rooms:', error);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const response = await fetch('/api/users');
            if (!response.ok) throw new Error('Failed to fetch users');
            allUsers = await response.json();
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    // Event listeners
    const initializeEventListeners = () => {
        // Mobile menu toggle
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', toggleSidebar);
        }

        // Desktop sidebar toggle
        if (desktopSidebarToggle) {
            desktopSidebarToggle.addEventListener('click', toggleDesktopSidebar);
        }

        // Sidebar overlay
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', closeSidebar);
        }

        // Theme toggle
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', toggleTheme);
        }

        // Sidebar click handler
        if (sidebar) {
            sidebar.addEventListener('click', handleSidebarClick);
        }

        // Message input events
        if (messageInput) {
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });

            messageInput.addEventListener('input', () => {
                autoResizeTextarea(messageInput);
                handleTyping();
            });
        }

        // Send button
        if (sendBtn) {
            sendBtn.addEventListener('click', sendMessage);
        }

        // Modal events
        if (createRoomBtn) {
            createRoomBtn.addEventListener('click', () => {
                if (createRoomModal) {
                    createRoomModal.classList.remove('hidden');
                    roomNameInput?.focus();
                }
            });
        }

        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                if (createRoomModal) {
                    createRoomModal.classList.add('hidden');
                }
            });
        }

        if (closeModalBtn2) {
            closeModalBtn2.addEventListener('click', () => {
                if (createRoomModal) {
                    createRoomModal.classList.add('hidden');
                }
            });
        }

        if (createRoomForm) {
            createRoomForm.addEventListener('submit', handleCreateRoom);
        }

        if (addMemberBtn) {
            addMemberBtn.addEventListener('click', openAddMemberModal);
        }

        if (closeAddMemberModalBtn) {
            closeAddMemberModalBtn.addEventListener('click', () => {
                if (addMemberModal) {
                    addMemberModal.classList.add('hidden');
                }
            });
        }

        if (closeAddMemberModalBtn2) {
            closeAddMemberModalBtn2.addEventListener('click', () => {
                if (addMemberModal) {
                    addMemberModal.classList.add('hidden');
                }
            });
        }

        // Room management event listeners
        if (roomManagementBtn) {
            roomManagementBtn.addEventListener('click', openRoomManagement);
        }
        if (closeRoomManagementModalBtn) {
            closeRoomManagementModalBtn.addEventListener('click', closeRoomManagement);
        }
        if (cancelRoomManagementBtn) {
            cancelRoomManagementBtn.addEventListener('click', closeRoomManagement);
        }
        if (deleteRoomBtn) {
            deleteRoomBtn.addEventListener('click', () => {
                if (deleteRoomConfirmationModal) {
                    deleteRoomConfirmationModal.classList.remove('hidden');
                }
            });
        }
        if (confirmDeleteRoomBtn) {
            confirmDeleteRoomBtn.addEventListener('click', deleteRoom);
        }
        if (cancelDeleteRoomBtn) {
            cancelDeleteRoomBtn.addEventListener('click', () => {
                if (deleteRoomConfirmationModal) {
                    deleteRoomConfirmationModal.classList.add('hidden');
                }
            });
        }

        // Room members list event delegation
        if (roomMembersList) {
            roomMembersList.addEventListener('click', (e) => {
                if (e.target.closest('.remove-member-btn')) {
                    const btn = e.target.closest('.remove-member-btn');
                    const userId = btn.dataset.userId;
                    const username = btn.dataset.username;
                    removeMember(userId, username);
                }
            });
        }

        if (addMemberUserList) {
            addMemberUserList.addEventListener('click', handleAddMemberClick);
        }
    };

    // Event handlers
    const handleSidebarClick = async (e) => {
        const chatButton = e.target.closest('button[data-chat-type]');
        if (!chatButton) return;
        
        // Clear unread indicator
        const indicator = chatButton.querySelector('.unread-indicator');
        if (indicator) {
            indicator.classList.add('hidden');
        }

        const { chatType, id, name, creator } = chatButton.dataset;
        activeChat = { type: chatType, id, name, creator };

        // Update active state
        document.querySelectorAll('[data-chat-type]').forEach(btn => {
            btn.classList.remove('bg-indigo-50', 'dark:bg-indigo-900/20', 'border-indigo-200', 'dark:border-indigo-700');
        });
        chatButton.classList.add('bg-indigo-50', 'dark:bg-indigo-900/20', 'border-indigo-200', 'dark:border-indigo-700');
        
        // Hide welcome message and show chat container
        hideWelcomeMessage();

        // Update chat header
        if (headerUsername) {
            headerUsername.textContent = name;
        }

        if (headerAvatar) {
            headerAvatar.textContent = name.charAt(0).toUpperCase();
        }

        if (headerStatus) {
            headerStatus.textContent = chatType === 'room' ? 'Group chat' : 'Online';
        }

        // Show/hide add member button
        if (addMemberBtn) {
            if (chatType === 'room' && creator === currentUserId) {
                addMemberBtn.classList.remove('hidden');
            } else {
                addMemberBtn.classList.add('hidden');
            }
        }

        // Show/hide room management button for room creators
        if (roomManagementBtn) {
            if (chatType === 'room' && creator === currentUserId) {
                roomManagementBtn.classList.remove('hidden');
            } else {
                roomManagementBtn.classList.add('hidden');
            }
        }

        // Load message history
        await loadMessageHistory(chatType, id);
        
        // Join room if it's a group chat
        if (chatType === 'room') {
            socket.emit('joinRoom', { roomId: id });
        }
        
        // Close sidebar on mobile
        closeSidebar();
    };

    const loadMessageHistory = async (chatType, chatId) => {
        if (loadingMessages) {
            loadingMessages.classList.remove('hidden');
        }

        chatMessages.innerHTML = '';
        lastMessageDate = null;

        try {
            let historyUrl = '';
            if (chatType === 'room') {
                historyUrl = `/api/messages/room/${chatId}`;
            } else {
                historyUrl = `/api/messages/${chatId}`;
            }

            const response = await fetch(historyUrl);
            if (!response.ok) throw new Error('Failed to load messages');

            const messages = await response.json();
            messages.forEach(message => outputMessage(message));
            
            // Add to contacts if this is a private chat
            if (chatType === 'dm') {
                const lastMessage = messages[messages.length - 1];
                if (lastMessage) {
                    addToContacts(chatId, activeChat.name, lastMessage.content);
                }
            }
            
            // Scroll to bottom after loading messages
            const messagesScrollArea = document.querySelector('.messages-scroll-area');
            if (messagesScrollArea) {
                messagesScrollArea.scrollTop = messagesScrollArea.scrollHeight;
            }

        } catch (error) {
            console.error('Failed to load message history:', error);
        } finally {
            if (loadingMessages) {
                loadingMessages.classList.add('hidden');
            }
        }
    };

    const sendMessage = async () => {
        const message = messageInput?.value.trim();
        if (!message || !activeChat.id) return;

        // Disable send button temporarily
        if (sendBtn) {
            sendBtn.disabled = true;
        }

        try {
            if (activeChat.type === 'room') {
                socket.emit('groupMessage', { roomId: activeChat.id, message });
            } else {
                socket.emit('privateMessage', { to: activeChat.id, message });
                
                // Add recipient to contacts and update last message
                addToContacts(activeChat.id, activeChat.name, message);
                updateContactLastMessage(activeChat.id, message);
                
                // Show message immediately for private chats
                const messageObj = {
                    _id: Date.now().toString(),
                    sender: { _id: currentUserId, username: currentUsername },
                    content: message,
                    createdAt: new Date()
                };
                outputMessage(messageObj);
            }

            // Clear input
            messageInput.value = '';
            autoResizeTextarea(messageInput);
            
            // Stop typing indicator
            stopTyping();
            
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            if (sendBtn) {
                sendBtn.disabled = false;
            }
        }
    };

    const handleTyping = () => {
        if (!activeChat.id) return;

        if (!isTyping) {
            isTyping = true;
            socket.emit('typing', { room: activeChat.id, isTyping: true });
        }

        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }

        typingTimeout = setTimeout(() => {
            stopTyping();
        }, 1000);
    };

    const stopTyping = () => {
        if (!activeChat.id || !isTyping) return;

        isTyping = false;
        socket.emit('typing', { room: activeChat.id, isTyping: false });

        if (typingTimeout) {
            clearTimeout(typingTimeout);
            typingTimeout = null;
        }
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        const roomName = roomNameInput?.value.trim();
        
        if (!roomName) return;

        try {
            const response = await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: roomName })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message);
            }

            roomNameInput.value = '';
            if (createRoomModal) {
                createRoomModal.classList.add('hidden');
            }
            await loadRooms();
            
        } catch (error) {
            if (roomError) {
                roomError.textContent = error.message;
            }
        }
    };

    const openAddMemberModal = async () => {
        if (addMemberModal) {
            addMemberModal.classList.remove('hidden');
        }

        try {
            const roomsResponse = await fetch('/api/rooms');
            const rooms = await roomsResponse.json();
            const currentRoom = rooms.find(r => r._id === activeChat.id);
            currentRoomMembers = currentRoom ? currentRoom.members : [];

            addMemberUserList.innerHTML = '';
            allUsers.forEach(user => {
                if (user._id !== currentUserId && !currentRoomMembers.includes(user._id)) {
                    const userElement = createUserElement(user);
                    addMemberUserList.appendChild(userElement);
                }
            });
        } catch (error) {
            console.error('Failed to load available users:', error);
        }
    };

    const createUserElement = (user) => {
        const userElement = document.createElement('div');
        userElement.className = 'flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200';
        
        const avatarGradient = getAvatarGradient(user.username);
        const initial = user.username.charAt(0).toUpperCase();
        
        userElement.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${avatarGradient} text-white font-semibold shadow-lg">
                    ${initial}
                </div>
                <div>
                    <div class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        ${escapeHtml(user.username)}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                        User
                    </div>
                </div>
            </div>
            <button 
                data-user-id="${user._id}" 
                class="add-user-btn px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
                Add
            </button>
        `;
        
        return userElement;
    };

    const handleAddMemberClick = async (e) => {
        if (e.target.classList.contains('add-user-btn')) {
            const button = e.target;
            const userId = button.dataset.userId;
            
            button.disabled = true;
            button.textContent = 'Adding...';

            try {
                const response = await fetch(`/api/rooms/${activeChat.id}/members`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message);
                }

                button.textContent = 'Added';
                button.classList.remove('bg-indigo-500', 'hover:bg-indigo-600');
                button.classList.add('bg-green-500');
                
            } catch (error) {
                console.error('Failed to add member:', error);
                button.textContent = 'Error';
                button.classList.remove('bg-indigo-500', 'hover:bg-indigo-600');
                button.classList.add('bg-red-500');
            }
        }
    };

    // Socket event listeners
    const initializeSocketListeners = () => {
        socket.on('updateUserStatus', (onlineUsersData) => {
            // Update global onlineUsers for contacts checking
            onlineUsers = onlineUsersData;
            
            userList.innerHTML = '';
            const users = Object.values(onlineUsersData).filter(u => u.username !== currentUsername);
            
            if (onlineUserCount) {
                onlineUserCount.textContent = users.length;
            }
            
            users.forEach(user => {
                const userId = Object.keys(onlineUsersData).find(key => onlineUsersData[key] === user);
                const userElement = createUserListElement(user, userId);
                userList.appendChild(userElement);
            });
            
            // Re-render contacts to update online status
            renderContacts();
        });

        socket.on('newPrivateMessage', ({ from, message, timestamp }) => {
            const messageObj = {
                _id: Date.now().toString(),
                sender: from,
                content: message,
                createdAt: timestamp || new Date()
            };

            // Add to contacts and update last message
            addToContacts(from.id, from.username, message);
            updateContactLastMessage(from.id, message);

            if (activeChat.type === 'dm' && from.id === activeChat.id) {
                outputMessage(messageObj);
            } else {
                // Show unread indicator in both contacts and online users
                const userButton = document.querySelector(`button[data-chat-type="dm"][data-id="${from.id}"]`);
                if (userButton) {
                    const indicator = userButton.querySelector('.unread-indicator');
                    if (indicator) {
                        indicator.classList.remove('hidden');
                    }
                }
            }
        });

        socket.on('newGroupMessage', (message) => {
            if (activeChat.type === 'room' && message.room === activeChat.id) {
                outputMessage(message);
            } else {
                const roomButton = document.querySelector(`button[data-chat-type="room"][data-id="${message.room}"]`);
                if (roomButton) {
                    const indicator = roomButton.querySelector('.unread-indicator');
                    if (indicator) {
                        indicator.classList.remove('hidden');
                    }
                }
            }
        });

        socket.on('typing', ({ user, isTyping }) => {
            if (activeChat.name === user) {
                if (isTyping) {
                    showTypingIndicator(user);
                } else {
                    hideTypingIndicator();
                }
            }
        });
    };

    const createUserListElement = (user, userId) => {
        const userElement = document.createElement('button');
        userElement.className = 'flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200 w-full text-left border border-transparent';
        userElement.dataset.chatType = 'dm';
        userElement.dataset.id = userId;
        userElement.dataset.name = user.username;
        
        const avatarGradient = getAvatarGradient(user.username);
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
                    ${escapeHtml(user.username)}
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
    };

    const showTypingIndicator = (username) => {
        if (typingIndicator) {
            typingIndicator.innerHTML = `
                <div class="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                    <div class="flex space-x-1">
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                    </div>
                    <span class="text-sm italic">${escapeHtml(username)} is typing...</span>
                </div>
            `;
            typingIndicator.classList.remove('hidden');
        }
    };

    const hideTypingIndicator = () => {
        if (typingIndicator) {
            typingIndicator.classList.add('hidden');
        }
    };

    // Initialize application
    const init = async () => {
        updateThemeIcon();
        initializeSidebarState();
        initializeEventListeners();
        initializeSocketListeners();
        await loadRooms();
        await fetchAllUsers();
        await loadContactsFromMessages();
        
        // Show welcome message by default
        showWelcomeMessage();
    };

    // Start the application
    init();
});
