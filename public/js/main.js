document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    const currentUserId = document.getElementById('current-user-id').value;
    const currentUsername = document.getElementById('current-user-username').value;

    // DOM Elements
    const chatHeader = document.getElementById('chat-header');
    const headerAvatar = document.getElementById('header-avatar');
    const headerUsername = document.getElementById('header-username');
    const headerStatus = document.getElementById('header-status');
    const userList = document.getElementById('user-list');
    const onlineUserCount = document.getElementById('online-user-count');
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const roomList = document.getElementById('room-list');
    const createRoomBtn = document.getElementById('create-room-btn');
    const createRoomModal = document.getElementById('create-room-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const createRoomForm = document.getElementById('create-room-form');
    const roomNameInput = document.getElementById('room-name-input');
    const roomError = document.getElementById('room-error');
    const addMemberBtn = document.getElementById('add-member-btn');
    const addMemberModal = document.getElementById('add-member-modal');
    const addMemberUserList = document.getElementById('add-member-user-list');
    const closeAddMemberModalBtn = document.getElementById('close-add-member-modal-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeIconSun = document.getElementById('theme-icon-sun');
    const themeIconMoon = document.getElementById('theme-icon-moon');

    let activeChat = { type: null, id: null, name: null, creator: null };
    let allUsers = [];
    let currentRoomMembers = [];

    // --- DATA FETCHING ---
    const loadRooms = async () => {
        try {
            const response = await fetch('/api/rooms');
            const rooms = await response.json();
            roomList.innerHTML = '';
            rooms.forEach(room => {
                const roomElement = document.createElement('button');
                roomElement.className = 'flex flex-row items-center hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl p-2 w-full text-left';
                roomElement.dataset.chatType = 'room';
                roomElement.dataset.id = room._id;
                roomElement.dataset.name = room.name;
                roomElement.dataset.creator = room.creator;
                roomElement.innerHTML = `<div class="flex items-center justify-center h-8 w-8 bg-indigo-200 rounded-full flex-shrink-0">#</div><div class="ml-2 text-sm font-semibold">${room.name}</div><span class="unread-indicator hidden ml-auto h-2 w-2 bg-blue-500 rounded-full"></span>`;
                roomList.appendChild(roomElement);
            });
        } catch (error) { console.error('Failed to load rooms:', error); }
    };

    const fetchAllUsers = async () => {
        try {
            const response = await fetch('/api/users');
            allUsers = await response.json();
        } catch (error) { console.error('Failed to fetch users:', error); }
    };

    socket.on('updateUserStatus', (onlineUsers) => {
        userList.innerHTML = '';
        const users = Object.values(onlineUsers).filter(u => u.username !== currentUsername);
        onlineUserCount.textContent = users.length;
        users.forEach(user => {
            const userElement = document.createElement('button');
            userElement.className = 'flex flex-row items-center hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl p-2 w-full text-left';
            userElement.dataset.chatType = 'dm';
            userElement.dataset.id = Object.keys(onlineUsers).find(key => onlineUsers[key] === user);
            userElement.dataset.name = user.username;
            userElement.innerHTML = `<div class="flex items-center justify-center h-8 w-8 bg-green-200 rounded-full flex-shrink-0">${user.username.charAt(0).toUpperCase()}</div><div class="ml-2 text-sm font-semibold">${user.username}</div><span class="unread-indicator hidden ml-auto h-2 w-2 bg-blue-500 rounded-full"></span>`;
            userList.appendChild(userElement);
        });
    });

    // --- CENTRAL CLICK HANDLER FOR SIDEBAR ---
    document.querySelector('.w-64').addEventListener('click', async (e) => {
        const chatButton = e.target.closest('button[data-chat-type]');
        if (!chatButton) return;
        
        const indicator = chatButton.querySelector('.unread-indicator');
        if (indicator) {
            indicator.classList.add('hidden');
        }

        const { chatType, id, name, creator } = chatButton.dataset;
        activeChat = { type: chatType, id, name, creator };

        document.querySelectorAll('[data-chat-type]').forEach(btn => btn.classList.remove('bg-gray-200', 'dark:bg-slate-900'));
        chatButton.classList.add('bg-gray-200', 'dark:bg-slate-900');
        
        chatHeader.classList.remove('hidden');
        chatHeader.classList.add('flex');
        headerUsername.textContent = name;
        headerAvatar.textContent = name.charAt(0).toUpperCase();

        let historyUrl = '';
        if (chatType === 'room') {
            socket.emit('joinRoom', { roomId: id });
            historyUrl = `/api/messages/room/${id}`;
            headerStatus.textContent = 'Group Room';
            if (creator === currentUserId) {
                addMemberBtn.classList.remove('hidden');
            } else {
                addMemberBtn.classList.add('hidden');
            }
        } else {
            historyUrl = `/api/messages/${id}`;
            headerStatus.textContent = 'Online';
            addMemberBtn.classList.add('hidden');
        }

        chatMessages.innerHTML = '';
        try {
            const response = await fetch(historyUrl);
            const messages = await response.json();
            messages.forEach(message => outputMessage(message));
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } catch (error) { console.error(`Failed to load ${chatType} history:`, error); }
    });

    // --- MESSAGE HANDLING ---
    const sendMessage = () => {
        const message = messageInput.value.trim();
        if (!message || !activeChat.id) return;
        if (activeChat.type === 'room') {
            socket.emit('groupMessage', { roomId: activeChat.id, message });
        } else {
            socket.emit('privateMessage', { to: activeChat.id, message });
            outputMessage({ sender: { _id: currentUserId, username: currentUsername }, content: message });
        }
        messageInput.value = '';
        messageInput.focus();
    };

    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => e.key === 'Enter' && sendMessage());

    socket.on('newPrivateMessage', ({ from, message }) => {
        if (activeChat.type === 'dm' && from.id === activeChat.id) {
            outputMessage({ sender: from, content: message });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            const userButton = document.querySelector(`button[data-chat-type="dm"][data-id="${from.id}"]`);
            if (userButton) {
                userButton.querySelector('.unread-indicator').classList.remove('hidden');
            }
        }
    });

    socket.on('newGroupMessage', (message) => {
        if (activeChat.type === 'room' && message.room === activeChat.id) {
            outputMessage(message);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            const roomButton = document.querySelector(`button[data-chat-type="room"][data-id="${message.room}"]`);
            if (roomButton) {
                roomButton.querySelector('.unread-indicator').classList.remove('hidden');
            }
        }
    });
    
    function outputMessage(message) {
        const senderId = message.sender._id || message.sender.id;
        const isCurrentUser = senderId === currentUserId;
        const messageElement = document.createElement('div');
        messageElement.className = `col-span-12 p-3 rounded-lg`;
        const alignment = isCurrentUser ? 'col-start-6' : 'col-start-1';

        const avatarInitial = message.sender.username.charAt(0).toUpperCase();
        const avatarColor = isCurrentUser ? 'bg-indigo-500' : 'bg-green-200';
        const messageBgColor = isCurrentUser ? 'bg-indigo-100 dark:bg-indigo-800' : 'bg-white dark:bg-slate-700';
        const flexAlignment = isCurrentUser ? 'justify-start flex-row-reverse' : 'flex-row';

        messageElement.innerHTML = `
            <div class="${alignment}">
                <div class="flex items-center ${flexAlignment}">
                    <div class="flex items-center justify-center h-10 w-10 rounded-full ${avatarColor} flex-shrink-0">${avatarInitial}</div>
                    <div class="relative mx-3 text-sm ${messageBgColor} py-2 px-4 shadow rounded-xl">
                        ${!isCurrentUser ? `<div class="font-semibold text-xs mb-1 text-gray-700 dark:text-gray-300">${message.sender.username}</div>` : ''}
                        <div>${message.content}</div>
                    </div>
                </div>
            </div>`;
        chatMessages.appendChild(messageElement);
    }
    
    // --- MODAL LOGIC ---
    createRoomBtn.addEventListener('click', () => createRoomModal.classList.remove('hidden'));
    closeModalBtn.addEventListener('click', () => createRoomModal.classList.add('hidden'));
    createRoomForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const roomName = roomNameInput.value.trim();
        if (!roomName) return;
        try {
            const response = await fetch('/api/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: roomName }) });
            if (!response.ok) { const err = await response.json(); throw new Error(err.message); }
            roomNameInput.value = '';
            createRoomModal.classList.add('hidden');
            await loadRooms();
        } catch (error) { roomError.textContent = error.message; }
    });

    addMemberBtn.addEventListener('click', async () => {
        addMemberModal.classList.remove('hidden');
        const res = await fetch('/api/rooms');
        const rooms = await res.json();
        const currentRoom = rooms.find(r => r._id === activeChat.id);
        currentRoomMembers = currentRoom ? currentRoom.members : [];
        addMemberUserList.innerHTML = '';
        allUsers.forEach(user => {
            if (user._id !== currentUserId && !currentRoomMembers.includes(user._id)) {
                const userItem = document.createElement('div');
                userItem.className = 'flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md';
                userItem.innerHTML = `<span>${user.username}</span><button data-user-id="${user._id}" class="add-user-btn px-3 py-1 bg-green-500 text-white text-xs rounded-md hover:bg-green-600">Add</button>`;
                addMemberUserList.appendChild(userItem);
            }
        });
    });

    closeAddMemberModalBtn.addEventListener('click', () => addMemberModal.classList.add('hidden'));
    addMemberUserList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('add-user-btn')) {
            const button = e.target;
            const userId = button.dataset.userId;
            try {
                const response = await fetch(`/api/rooms/${activeChat.id}/members`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) });
                if (!response.ok) { const err = await response.json(); throw new Error(err.message); }
                button.textContent = 'Added';
                button.disabled = true;
                button.classList.remove('bg-green-500', 'hover:bg-green-600');
                button.classList.add('bg-gray-400');
            } catch (error) { console.error('Failed to add member:', error); button.textContent = 'Error'; }
        }
    });

    // --- THEME TOGGLE LOGIC ---
    const updateThemeIcon = () => {
        if (document.documentElement.classList.contains('dark')) {
            themeIconSun.classList.add('hidden');
            themeIconMoon.classList.remove('hidden');
        } else {
            themeIconSun.classList.remove('hidden');
            themeIconMoon.classList.add('hidden');
        }
    };
    updateThemeIcon();
    themeToggleBtn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        if (document.documentElement.classList.contains('dark')) {
            localStorage.theme = 'dark';
        } else {
            localStorage.theme = 'light';
        }
        updateThemeIcon();
    });

    // --- INITIAL LOAD ---
    loadRooms();
    fetchAllUsers();
});