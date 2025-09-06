/**
 * Message Renderer
 * Handles rendering of messages with timestamps and improved styling
 */

import { dom } from './dom.js';
import { Utils } from './utils.js';

export class MessageRenderer {
    constructor() {
        this.messageCache = new Map();
        this.lastMessageDate = null;
    }

    /**
     * Render a single message
     * @param {Object} message - Message object
     * @param {string} currentUserId - Current user ID
     * @param {boolean} showTimestamp - Whether to show timestamp
     */
    renderMessage(message, currentUserId, showTimestamp = true) {
        const senderId = message.sender._id || message.sender.id;
        const isCurrentUser = senderId === currentUserId;
        const timestamp = message.createdAt || new Date();
        
        // Check if we need to show date separator
        const shouldShowDateSeparator = this.shouldShowDateSeparator(timestamp);
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message-item';
        messageElement.dataset.messageId = message._id || Utils.generateId();
        
        let messageHTML = '';
        
        // Add date separator if needed
        if (shouldShowDateSeparator) {
            messageHTML += this.createDateSeparator(timestamp);
        }
        
        // Add message content
        messageHTML += this.createMessageContent(message, isCurrentUser, showTimestamp);
        
        messageElement.innerHTML = messageHTML;
        
        // Add animation class
        messageElement.classList.add('animate-fade-in');
        
        // Cache message for potential updates
        this.messageCache.set(message._id || Utils.generateId(), messageElement);
        
        return messageElement;
    }

    /**
     * Create date separator
     * @param {Date} timestamp - Message timestamp
     * @returns {string} HTML for date separator
     */
    createDateSeparator(timestamp) {
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
    }

    /**
     * Create message content
     * @param {Object} message - Message object
     * @param {boolean} isCurrentUser - Whether message is from current user
     * @param {boolean} showTimestamp - Whether to show timestamp
     * @returns {string} HTML for message content
     */
    createMessageContent(message, isCurrentUser, showTimestamp) {
        const sender = message.sender;
        const content = Utils.escapeHtml(message.content);
        const timestamp = message.createdAt || new Date();
        const timeString = Utils.formatMessageTime(timestamp);
        const avatarGradient = Utils.getAvatarGradient(sender.username);
        
        const alignment = isCurrentUser ? 'justify-end' : 'justify-start';
        const messageBg = isCurrentUser 
            ? 'bg-indigo-500 text-white' 
            : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-slate-600';
        
        return `
            <div class="flex ${alignment} mb-4 group">
                <div class="flex items-end space-x-2 max-w-xs lg:max-w-md xl:max-w-lg">
                    ${!isCurrentUser ? this.createAvatar(sender, avatarGradient) : ''}
                    
                    <div class="flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}">
                        ${!isCurrentUser ? this.createSenderName(sender.username) : ''}
                        
                        <div class="relative">
                            <div class="px-4 py-2 rounded-2xl ${messageBg} shadow-sm hover:shadow-md transition-shadow duration-200">
                                <div class="text-sm leading-relaxed break-words">${content}</div>
                            </div>
                            
                            ${showTimestamp ? this.createMessageTimestamp(timeString, isCurrentUser) : ''}
                        </div>
                    </div>
                    
                    ${isCurrentUser ? this.createAvatar(sender, avatarGradient) : ''}
                </div>
            </div>
        `;
    }

    /**
     * Create avatar element
     * @param {Object} sender - Sender object
     * @param {string} gradient - Gradient class
     * @returns {string} HTML for avatar
     */
    createAvatar(sender, gradient) {
        const initial = sender.username.charAt(0).toUpperCase();
        return `
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                ${initial}
            </div>
        `;
    }

    /**
     * Create sender name element
     * @param {string} username - Username
     * @returns {string} HTML for sender name
     */
    createSenderName(username) {
        return `
            <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 px-1">
                ${Utils.escapeHtml(username)}
            </div>
        `;
    }

    /**
     * Create message timestamp
     * @param {string} timeString - Formatted time string
     * @param {boolean} isCurrentUser - Whether message is from current user
     * @returns {string} HTML for timestamp
     */
    createMessageTimestamp(timeString, isCurrentUser) {
        const alignment = isCurrentUser ? 'text-right' : 'text-left';
        return `
            <div class="absolute ${isCurrentUser ? '-left-16' : '-right-16'} top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span class="text-xs text-gray-400 dark:text-gray-500 ${alignment} whitespace-nowrap">
                    ${timeString}
                </span>
            </div>
        `;
    }

    /**
     * Check if date separator should be shown
     * @param {Date} timestamp - Message timestamp
     * @returns {boolean} True if date separator should be shown
     */
    shouldShowDateSeparator(timestamp) {
        if (!this.lastMessageDate) {
            this.lastMessageDate = new Date(timestamp);
            return true;
        }
        
        const currentDate = new Date(timestamp);
        const lastDate = new Date(this.lastMessageDate);
        
        // Check if dates are different
        const isDifferentDate = currentDate.toDateString() !== lastDate.toDateString();
        
        if (isDifferentDate) {
            this.lastMessageDate = currentDate;
            return true;
        }
        
        return false;
    }

    /**
     * Render multiple messages
     * @param {Array} messages - Array of message objects
     * @param {string} currentUserId - Current user ID
     * @param {boolean} prepend - Whether to prepend messages (for pagination)
     */
    renderMessages(messages, currentUserId, prepend = false) {
        const fragment = document.createDocumentFragment();
        
        messages.forEach(message => {
            const messageElement = this.renderMessage(message, currentUserId);
            fragment.appendChild(messageElement);
        });
        
        if (prepend) {
            dom.elements.chatMessages.insertBefore(fragment, dom.elements.chatMessages.firstChild);
        } else {
            dom.elements.chatMessages.appendChild(fragment);
        }
        
        // Scroll to bottom if not prepending
        if (!prepend) {
            dom.scrollToBottom(dom.elements.chatMessages);
        }
    }

    /**
     * Clear all messages
     */
    clearMessages() {
        if (dom.elements.chatMessages) {
            dom.elements.chatMessages.innerHTML = '';
            this.messageCache.clear();
            this.lastMessageDate = null;
        }
    }

    /**
     * Update message status (delivered, read, etc.)
     * @param {string} messageId - Message ID
     * @param {string} status - New status
     */
    updateMessageStatus(messageId, status) {
        const messageElement = this.messageCache.get(messageId);
        if (messageElement) {
            // Update status indicator if needed
            const statusElement = messageElement.querySelector('.message-status');
            if (statusElement) {
                statusElement.textContent = status;
            }
        }
    }

    /**
     * Add typing indicator
     * @param {string} username - Username of typing user
     */
    showTypingIndicator(username) {
        if (dom.elements.typingIndicator) {
            dom.elements.typingIndicator.innerHTML = `
                <div class="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                    <div class="flex space-x-1">
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                    </div>
                    <span class="text-sm italic">${Utils.escapeHtml(username)} is typing...</span>
                </div>
            `;
            dom.showElement(dom.elements.typingIndicator);
        }
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        if (dom.elements.typingIndicator) {
            dom.hideElement(dom.elements.typingIndicator);
        }
    }

    /**
     * Show loading state for messages
     */
    showMessageLoading() {
        if (dom.elements.loadingMessages) {
            dom.showElement(dom.elements.loadingMessages);
        }
    }

    /**
     * Hide loading state for messages
     */
    hideMessageLoading() {
        if (dom.elements.loadingMessages) {
            dom.hideElement(dom.elements.loadingMessages);
        }
    }
}

export const messageRenderer = new MessageRenderer();
