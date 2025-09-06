/**
 * Modal Handler
 * Handles modal interactions for creating rooms and adding members
 */

import { dom } from './dom.js';
import { Utils } from './utils.js';

export class ModalHandler {
    constructor() {
        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners for modals
     */
    initializeEventListeners() {
        // Create room modal
        this.initializeCreateRoomModal();
        
        // Add member modal
        this.initializeAddMemberModal();
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    /**
     * Initialize create room modal
     */
    initializeCreateRoomModal() {
        // Open modal
        if (dom.elements.createRoomBtn) {
            dom.elements.createRoomBtn.addEventListener('click', () => {
                this.openCreateRoomModal();
            });
        }

        // Close modal buttons
        if (dom.elements.closeModalBtn) {
            dom.elements.closeModalBtn.addEventListener('click', () => {
                this.closeCreateRoomModal();
            });
        }

        if (dom.elements.closeModalBtn2) {
            dom.elements.closeModalBtn2.addEventListener('click', () => {
                this.closeCreateRoomModal();
            });
        }

        // Form submission
        if (dom.elements.createRoomForm) {
            dom.elements.createRoomForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreateRoom();
            });
        }

        // Input validation
        if (dom.elements.roomNameInput) {
            dom.elements.roomNameInput.addEventListener('input', () => {
                this.validateRoomName();
            });
        }
    }

    /**
     * Initialize add member modal
     */
    initializeAddMemberModal() {
        // Open modal
        if (dom.elements.addMemberBtn) {
            dom.elements.addMemberBtn.addEventListener('click', () => {
                this.openAddMemberModal();
            });
        }

        // Close modal buttons
        if (dom.elements.closeAddMemberModalBtn) {
            dom.elements.closeAddMemberModalBtn.addEventListener('click', () => {
                this.closeAddMemberModal();
            });
        }

        if (dom.elements.closeAddMemberModalBtn2) {
            dom.elements.closeAddMemberModalBtn2.addEventListener('click', () => {
                this.closeAddMemberModal();
            });
        }

        // Add member button clicks
        if (dom.elements.addMemberUserList) {
            dom.elements.addMemberUserList.addEventListener('click', (e) => {
                if (e.target.classList.contains('add-user-btn')) {
                    this.handleAddMember(e.target);
                }
            });
        }
    }

    /**
     * Open create room modal
     */
    openCreateRoomModal() {
        if (dom.elements.createRoomModal) {
            dom.showElement(dom.elements.createRoomModal);
            dom.elements.roomNameInput?.focus();
            this.clearRoomForm();
        }
    }

    /**
     * Close create room modal
     */
    closeCreateRoomModal() {
        if (dom.elements.createRoomModal) {
            dom.hideElement(dom.elements.createRoomModal);
            this.clearRoomForm();
        }
    }

    /**
     * Clear room form
     */
    clearRoomForm() {
        if (dom.elements.roomNameInput) {
            dom.elements.roomNameInput.value = '';
        }
        if (dom.elements.roomError) {
            dom.clearError(dom.elements.roomError);
        }
    }

    /**
     * Validate room name
     */
    validateRoomName() {
        const roomName = dom.elements.roomNameInput?.value.trim();
        
        if (!roomName) {
            dom.clearError(dom.elements.roomError);
            return false;
        }

        if (roomName.length < 3) {
            dom.showError(dom.elements.roomError, 'Room name must be at least 3 characters');
            return false;
        }

        if (roomName.length > 50) {
            dom.showError(dom.elements.roomError, 'Room name must be less than 50 characters');
            return false;
        }

        if (!/^[a-zA-Z0-9\s-_]+$/.test(roomName)) {
            dom.showError(dom.elements.roomError, 'Room name can only contain letters, numbers, spaces, hyphens, and underscores');
            return false;
        }

        dom.clearError(dom.elements.roomError);
        return true;
    }

    /**
     * Handle create room form submission
     */
    async handleCreateRoom() {
        const roomName = dom.elements.roomNameInput?.value.trim();
        
        if (!roomName || !this.validateRoomName()) {
            return;
        }

        // Disable form
        this.setCreateRoomFormState(true);

        try {
            const response = await fetch('/api/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: roomName }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create room');
            }

            const newRoom = await response.json();
            
            // Close modal
            this.closeCreateRoomModal();
            
            // Show success message
            this.showSuccess('Room created successfully!');
            
            // Emit room created event
            this.emitRoomCreated(newRoom);
            
        } catch (error) {
            console.error('Failed to create room:', error);
            dom.showError(dom.elements.roomError, error.message);
        } finally {
            this.setCreateRoomFormState(false);
        }
    }

    /**
     * Set create room form state
     * @param {boolean} disabled - Whether form should be disabled
     */
    setCreateRoomFormState(disabled) {
        if (dom.elements.roomNameInput) {
            dom.elements.roomNameInput.disabled = disabled;
        }
        if (dom.elements.createRoomSubmit) {
            dom.elements.createRoomSubmit.disabled = disabled;
        }
    }

    /**
     * Open add member modal
     */
    async openAddMemberModal() {
        if (dom.elements.addMemberModal) {
            dom.showElement(dom.elements.addMemberModal);
            await this.loadAvailableUsers();
        }
    }

    /**
     * Close add member modal
     */
    closeAddMemberModal() {
        if (dom.elements.addMemberModal) {
            dom.hideElement(dom.elements.addMemberModal);
        }
    }

    /**
     * Load available users for adding to room
     */
    async loadAvailableUsers() {
        try {
            // Get current room data
            const roomsResponse = await fetch('/api/rooms');
            if (!roomsResponse.ok) throw new Error('Failed to load rooms');
            
            const rooms = await roomsResponse.json();
            const activeChat = this.getActiveChat();
            const currentRoom = rooms.find(r => r._id === activeChat.id);
            
            if (!currentRoom) {
                throw new Error('Room not found');
            }

            // Get all users
            const usersResponse = await fetch('/api/users');
            if (!usersResponse.ok) throw new Error('Failed to load users');
            
            const allUsers = await usersResponse.json();
            
            // Filter out current user and existing members
            const availableUsers = allUsers.filter(user => 
                user._id !== dom.elements.currentUserId && 
                !currentRoom.members.includes(user._id)
            );

            this.renderAvailableUsers(availableUsers);
            
        } catch (error) {
            console.error('Failed to load available users:', error);
            this.showError('Failed to load users');
        }
    }

    /**
     * Render available users
     * @param {Array} users - Array of user objects
     */
    renderAvailableUsers(users) {
        if (!dom.elements.addMemberUserList) return;
        
        dom.elements.addMemberUserList.innerHTML = '';
        
        if (users.length === 0) {
            dom.elements.addMemberUserList.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>No users available to add</p>
                </div>
            `;
            return;
        }

        users.forEach(user => {
            const userElement = this.createUserElement(user);
            dom.elements.addMemberUserList.appendChild(userElement);
        });
    }

    /**
     * Create user element for add member modal
     * @param {Object} user - User object
     * @returns {Element} User element
     */
    createUserElement(user) {
        const userElement = document.createElement('div');
        userElement.className = 'flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200';
        
        const avatarGradient = Utils.getAvatarGradient(user.username);
        const initial = user.username.charAt(0).toUpperCase();
        
        userElement.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${avatarGradient} text-white font-semibold shadow-lg">
                    ${initial}
                </div>
                <div>
                    <div class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        ${Utils.escapeHtml(user.username)}
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
    }

    /**
     * Handle add member button click
     * @param {Element} button - Add member button
     */
    async handleAddMember(button) {
        const userId = button.dataset.userId;
        const activeChat = this.getActiveChat();
        
        if (!userId || !activeChat.id) return;

        // Disable button
        button.disabled = true;
        button.textContent = 'Adding...';

        try {
            const response = await fetch(`/api/rooms/${activeChat.id}/members`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to add member');
            }

            // Update button state
            button.textContent = 'Added';
            button.classList.remove('bg-indigo-500', 'hover:bg-indigo-600');
            button.classList.add('bg-green-500');
            
            // Show success message
            this.showSuccess('Member added successfully!');
            
        } catch (error) {
            console.error('Failed to add member:', error);
            button.textContent = 'Error';
            button.classList.remove('bg-indigo-500', 'hover:bg-indigo-600');
            button.classList.add('bg-red-500');
            this.showError('Failed to add member');
        }
    }

    /**
     * Get active chat data
     * @returns {Object} Active chat data
     */
    getActiveChat() {
        // This should be imported from sidebar module
        // For now, we'll get it from the global state
        return window.activeChat || { type: null, id: null, name: null, creator: null };
    }

    /**
     * Close all modals
     */
    closeAllModals() {
        this.closeCreateRoomModal();
        this.closeAddMemberModal();
    }

    /**
     * Emit room created event
     * @param {Object} room - New room object
     */
    emitRoomCreated(room) {
        const event = new CustomEvent('roomCreated', { detail: room });
        document.dispatchEvent(event);
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
}

export { ModalHandler };
