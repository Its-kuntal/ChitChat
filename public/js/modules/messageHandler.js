/**
 * Message Handler
 * Handles message sending, receiving, and real-time updates
 */

import { dom } from './dom.js';
import { Utils } from './utils.js';
import { messageRenderer } from './messageRenderer.js';
import { sidebar } from './sidebar.js';

export class MessageHandler {
    constructor(socket) {
        this.socket = socket;
        this.isTyping = false;
        this.typingTimeout = null;
        this.messageQueue = [];
        this.isProcessingQueue = false;
        
        this.initializeEventListeners();
        this.initializeSocketListeners();
    }

    /**
     * Initialize event listeners for message handling
     */
    initializeEventListeners() {
        // Send button click
        if (dom.elements.sendBtn) {
            dom.elements.sendBtn.addEventListener('click', () => {
                this.sendMessage();
            });
        }

        // Message input events
        if (dom.elements.messageInput) {
            // Enter key to send
            dom.elements.messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // Auto-resize textarea
            dom.elements.messageInput.addEventListener('input', () => {
                dom.autoResizeTextarea(dom.elements.messageInput);
                this.handleTyping();
            });

            // Focus events
            dom.elements.messageInput.addEventListener('focus', () => {
                this.handleFocus();
            });

            dom.elements.messageInput.addEventListener('blur', () => {
                this.handleBlur();
            });
        }

        // Listen for chat selection
        document.addEventListener('chatSelected', (e) => {
            this.handleChatSelected(e.detail);
        });
    }

    /**
     * Initialize socket event listeners
     */
    initializeSocketListeners() {
        // Private message received
        this.socket.on('newPrivateMessage', (data) => {
            this.handlePrivateMessage(data);
        });

        // Group message received
        this.socket.on('newGroupMessage', (message) => {
            this.handleGroupMessage(message);
        });

        // Typing indicator
        this.socket.on('typing', (data) => {
            this.handleTypingIndicator(data);
        });

        // User status updates
        this.socket.on('updateUserStatus', (onlineUsers) => {
            sidebar.updateUserStatus(onlineUsers);
        });
    }

    /**
     * Send message
     */
    async sendMessage() {
        const message = dom.elements.messageInput?.value.trim();
        const activeChat = sidebar.getActiveChat();
        
        if (!message || !activeChat.id) return;

        // Disable send button temporarily
        this.setSendButtonState(true);

        try {
            if (activeChat.type === 'room') {
                this.socket.emit('groupMessage', { 
                    roomId: activeChat.id, 
                    message 
                });
            } else {
                this.socket.emit('privateMessage', { 
                    to: activeChat.id, 
                    message 
                });
                
                // Show message immediately for private chats
                this.showSentMessage(message);
            }

            // Clear input
            dom.elements.messageInput.value = '';
            dom.autoResizeTextarea(dom.elements.messageInput);
            
            // Stop typing indicator
            this.stopTyping();
            
        } catch (error) {
            console.error('Failed to send message:', error);
            this.showError('Failed to send message');
        } finally {
            this.setSendButtonState(false);
        }
    }

    /**
     * Show sent message immediately (optimistic update)
     * @param {string} message - Message content
     */
    showSentMessage(message) {
        const activeChat = sidebar.getActiveChat();
        if (activeChat.type !== 'dm') return;

        const currentUser = {
            _id: dom.elements.currentUserId,
            username: dom.elements.currentUsername
        };

        const messageObj = {
            _id: Utils.generateId(),
            sender: currentUser,
            content: message,
            createdAt: new Date()
        };

        const messageElement = messageRenderer.renderMessage(messageObj, dom.elements.currentUserId);
        dom.elements.chatMessages.appendChild(messageElement);
        dom.scrollToBottom(dom.elements.chatMessages);
    }

    /**
     * Handle private message received
     * @param {Object} data - Message data
     */
    handlePrivateMessage(data) {
        const { from, message, timestamp } = data;
        const activeChat = sidebar.getActiveChat();

        const messageObj = {
            _id: Utils.generateId(),
            sender: from,
            content: message,
            createdAt: timestamp || new Date()
        };

        // Show message if it's the active chat
        if (activeChat.type === 'dm' && from.id === activeChat.id) {
            const messageElement = messageRenderer.renderMessage(messageObj, dom.elements.currentUserId);
            dom.elements.chatMessages.appendChild(messageElement);
            dom.scrollToBottom(dom.elements.chatMessages);
        } else {
            // Show unread indicator
            sidebar.showUnreadIndicator(from.id, 'dm');
        }
    }

    /**
     * Handle group message received
     * @param {Object} message - Message object
     */
    handleGroupMessage(message) {
        const activeChat = sidebar.getActiveChat();

        // Show message if it's the active room
        if (activeChat.type === 'room' && message.room === activeChat.id) {
            const messageElement = messageRenderer.renderMessage(message, dom.elements.currentUserId);
            dom.elements.chatMessages.appendChild(messageElement);
            dom.scrollToBottom(dom.elements.chatMessages);
        } else {
            // Show unread indicator
            sidebar.showUnreadIndicator(message.room, 'room');
        }
    }

    /**
     * Handle chat selection
     * @param {Object} chatData - Chat data
     */
    async handleChatSelected(chatData) {
        // Update chat header
        this.updateChatHeader(chatData);
        
        // Clear messages
        messageRenderer.clearMessages();
        
        // Load message history
        await this.loadMessageHistory(chatData);
        
        // Join room if it's a group chat
        if (chatData.type === 'room') {
            this.socket.emit('joinRoom', { roomId: chatData.id });
        }
    }

    /**
     * Update chat header
     * @param {Object} chatData - Chat data
     */
    updateChatHeader(chatData) {
        // Hide welcome message and show chat container
        this.hideWelcomeMessage();

        if (dom.elements.headerUsername) {
            dom.elements.headerUsername.textContent = chatData.name;
        }

        if (dom.elements.headerAvatar) {
            dom.elements.headerAvatar.textContent = chatData.name.charAt(0).toUpperCase();
        }

        if (dom.elements.headerStatus) {
            dom.elements.headerStatus.textContent = chatData.type === 'room' ? 'Group chat' : 'Online';
        }

        // Show/hide add member button
        if (dom.elements.addMemberBtn) {
            if (chatData.type === 'room' && chatData.creator === dom.elements.currentUserId) {
                dom.showElement(dom.elements.addMemberBtn);
            } else {
                dom.hideElement(dom.elements.addMemberBtn);
            }
        }
    }

    /**
     * Show welcome message
     */
    showWelcomeMessage() {
        if (dom.elements.welcomeMessage) {
            dom.showElement(dom.elements.welcomeMessage);
        }
        if (dom.elements.chatContainer) {
            dom.hideElement(dom.elements.chatContainer);
        }
        if (dom.elements.chatHeader) {
            dom.hideElement(dom.elements.chatHeader);
        }
    }

    /**
     * Hide welcome message
     */
    hideWelcomeMessage() {
        if (dom.elements.welcomeMessage) {
            dom.hideElement(dom.elements.welcomeMessage);
        }
        if (dom.elements.chatContainer) {
            dom.showElement(dom.elements.chatContainer, 'flex');
        }
        if (dom.elements.chatHeader) {
            dom.showElement(dom.elements.chatHeader, 'flex');
        }
    }

    /**
     * Load message history
     * @param {Object} chatData - Chat data
     */
    async loadMessageHistory(chatData) {
        messageRenderer.showMessageLoading();

        try {
            let historyUrl = '';
            if (chatData.type === 'room') {
                historyUrl = `/api/messages/room/${chatData.id}`;
            } else {
                historyUrl = `/api/messages/${chatData.id}`;
            }

            const response = await fetch(historyUrl);
            if (!response.ok) throw new Error('Failed to load messages');

            const messages = await response.json();
            messageRenderer.renderMessages(messages, dom.elements.currentUserId);

        } catch (error) {
            console.error('Failed to load message history:', error);
            this.showError('Failed to load messages');
        } finally {
            messageRenderer.hideMessageLoading();
        }
    }

    /**
     * Handle typing indicator
     * @param {Object} data - Typing data
     */
    handleTypingIndicator(data) {
        const { user, isTyping } = data;
        const activeChat = sidebar.getActiveChat();

        // Only show typing indicator for active chat
        if (activeChat.name === user) {
            if (isTyping) {
                messageRenderer.showTypingIndicator(user);
            } else {
                messageRenderer.hideTypingIndicator();
            }
        }
    }

    /**
     * Handle typing start/stop
     */
    handleTyping() {
        const activeChat = sidebar.getActiveChat();
        if (!activeChat.id) return;

        if (!this.isTyping) {
            this.isTyping = true;
            this.socket.emit('typing', { 
                room: activeChat.id, 
                isTyping: true 
            });
        }

        // Clear existing timeout
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        // Set new timeout to stop typing
        this.typingTimeout = setTimeout(() => {
            this.stopTyping();
        }, 1000);
    }

    /**
     * Stop typing indicator
     */
    stopTyping() {
        const activeChat = sidebar.getActiveChat();
        if (!activeChat.id || !this.isTyping) return;

        this.isTyping = false;
        this.socket.emit('typing', { 
            room: activeChat.id, 
            isTyping: false 
        });

        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
            this.typingTimeout = null;
        }
    }

    /**
     * Handle input focus
     */
    handleFocus() {
        // Add focus styles if needed
        dom.addClass(dom.elements.messageInput, 'ring-2');
    }

    /**
     * Handle input blur
     */
    handleBlur() {
        // Remove focus styles
        dom.removeClass(dom.elements.messageInput, 'ring-2');
        this.stopTyping();
    }

    /**
     * Set send button state
     * @param {boolean} disabled - Whether button should be disabled
     */
    setSendButtonState(disabled) {
        if (dom.elements.sendBtn) {
            dom.elements.sendBtn.disabled = disabled;
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        // Create toast notification
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
        // Create toast notification
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
     * Load older messages (pagination)
     * @param {string} chatId - Chat ID
     * @param {string} chatType - Chat type
     * @param {string} lastMessageId - Last message ID
     */
    async loadOlderMessages(chatId, chatType, lastMessageId) {
        try {
            let url = '';
            if (chatType === 'room') {
                url = `/api/messages/room/${chatId}?before=${lastMessageId}`;
            } else {
                url = `/api/messages/${chatId}?before=${lastMessageId}`;
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to load older messages');

            const messages = await response.json();
            if (messages.length > 0) {
                messageRenderer.renderMessages(messages, dom.elements.currentUserId, true);
            }

        } catch (error) {
            console.error('Failed to load older messages:', error);
        }
    }
}

export { MessageHandler };
