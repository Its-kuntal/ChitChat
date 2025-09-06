const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Middleware to protect routes
exports.protect = async (req, res, next) => {
    let token;
    if (req.cookies.token) {
        try {
            token = req.cookies.token;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            console.error(error);
            res.status(401).redirect('/?error=Not authorized, token failed');
        }
    }

    if (!token) {
        res.status(401).redirect('/?error=Not authorized, no token');
    }
};

// Middleware to protect Socket.IO connections
exports.protectSocket = async (socket, next) => {
    const token = socket.handshake.headers.cookie?.split('; ').find(row => row.startsWith('token='))?.split('=')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            console.error(error);
            return next(new Error('Authentication error'));
        }
    } else {
        return next(new Error('Authentication error'));
    }
};