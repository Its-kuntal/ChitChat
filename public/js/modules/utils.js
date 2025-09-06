/**
 * Utility Functions
 * Common utility functions for the chat application
 */

export class Utils {
    /**
     * Format timestamp to readable format
     * @param {Date|string} timestamp - The timestamp to format
     * @returns {string} Formatted time string
     */
    static formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        // Less than 1 minute
        if (diff < 60000) {
            return 'Just now';
        }
        
        // Less than 1 hour
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        }
        
        // Less than 24 hours
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        }
        
        // More than 24 hours - show date
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Format timestamp for message display
     * @param {Date|string} timestamp - The timestamp to format
     * @returns {string} Formatted time string
     */
    static formatMessageTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    /**
     * Generate avatar color based on username
     * @param {string} username - The username
     * @returns {string} CSS class for avatar color
     */
    static getAvatarColor(username) {
        const colors = [
            'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
            'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
        ];
        const index = username.charCodeAt(0) % colors.length;
        return colors[index];
    }

    /**
     * Generate gradient colors for avatar
     * @param {string} username - The username
     * @returns {string} CSS class for gradient
     */
    static getAvatarGradient(username) {
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
    }

    /**
     * Debounce function to limit function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function to limit function calls
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Check if element is in viewport
     * @param {Element} element - Element to check
     * @returns {boolean} True if element is in viewport
     */
    static isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    /**
     * Smooth scroll to element
     * @param {Element} element - Element to scroll to
     * @param {number} offset - Offset from top
     */
    static smoothScrollTo(element, offset = 0) {
        if (element) {
            const elementPosition = element.offsetTop - offset;
            window.scrollTo({
                top: elementPosition,
                behavior: 'smooth'
            });
        }
    }

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} Success status
     */
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            } catch (err) {
                document.body.removeChild(textArea);
                return false;
            }
        }
    }

    /**
     * Generate unique ID
     * @returns {string} Unique ID
     */
    static generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid email
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate username format
     * @param {string} username - Username to validate
     * @returns {boolean} True if valid username
     */
    static isValidUsername(username) {
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        return usernameRegex.test(username);
    }

    /**
     * Get file size in human readable format
     * @param {number} bytes - File size in bytes
     * @returns {string} Human readable file size
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get file extension from filename
     * @param {string} filename - Filename
     * @returns {string} File extension
     */
    static getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
    }

    /**
     * Check if file is image
     * @param {string} filename - Filename
     * @returns {boolean} True if image file
     */
    static isImageFile(filename) {
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
        const extension = this.getFileExtension(filename).toLowerCase();
        return imageExtensions.includes(extension);
    }
}
