const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { protectSocket } = require('./middleware/authMiddleware');
const Message = require('./models/messageModel');

// Load env variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// EJS for views
app.set('view engine', 'ejs');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', require('./routes/userRoutes'));
app.use('/api', require('./routes/chatRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));

// In-memory store for online users and typing status
const onlineUsers = {};
const typingUsers = {};

// Protect Socket.IO connections with middleware
io.use(protectSocket);

// Run when a client connects
io.on('connection', (socket) => {
    console.log(`New WebSocket Connection: ${socket.id}`);
    const userId = socket.user.id;
    const username = socket.user.username;

    // Add user to online list
    onlineUsers[userId] = { username, status: 'online' };
    io.emit('updateUserStatus', onlineUsers);

    // Join a personal room
    socket.join(userId);

    // Inside io.on('connection', socket => { ... })

    // Listen for a user joining a room
    socket.on('joinRoom', ({ roomId }) => {
        socket.join(roomId);
        console.log(`${username} joined room: ${roomId}`);
    });

    // Listen for a message sent to a room
    socket.on('groupMessage', async ({ roomId, message }) => {
        try {
            // Save the message to the database
            const newMessage = await Message.create({
                content: message,
                sender: userId,
                room: roomId,
            });

            // Populate sender info before broadcasting
            const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'username');

            // Broadcast the new message to everyone in the room
            io.to(roomId).emit('newGroupMessage', populatedMessage);

        } catch (error) {
            console.error('Error handling group message:', error);
        }
    });
    // Listen for private messages
    // This is the new, correct version that saves messages
    socket.on('privateMessage', async ({ to, message }) => {
        try {
            // 1. Save the message to the database
            await Message.create({
                content: message,
                sender: userId,
                recipient: to,
            });

            // 2. Emit the message to the recipient
            socket.to(to).emit('newPrivateMessage', {
                from: { id: userId, username },
                to,
                message,
                timestamp: new Date()
            });

        } catch (error) {
            console.error('Error handling private message:', error);
        }
    });

    // Listen for typing indicator
    socket.on('typing', ({ room, isTyping }) => {
        if (isTyping) {
            typingUsers[userId] = username;
        } else {
            delete typingUsers[userId];
        }
        // Broadcast to the specific room
        socket.to(room).emit('typing', { user: username, isTyping });
    });


    // Runs when client disconnects
    socket.on('disconnect', () => {
        console.log(`WebSocket Disconnected: ${socket.id}`);
        delete onlineUsers[userId];
        delete typingUsers[userId];
        io.emit('updateUserStatus', onlineUsers);
    });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));