const Message = require('../models/messageModel');
const User = require('../models/userModel');

// @desc    Get messages between two users
// @route   GET /api/messages/:otherUserId
exports.getMessages = async (req, res) => {
    try {
        const loggedInUserId = req.user.id;
        const otherUserId = req.params.otherUserId;

        // Find messages where the sender and recipient are the two users
        const messages = await Message.find({
            $or: [
                { sender: loggedInUserId, recipient: otherUserId },
                { sender: otherUserId, recipient: loggedInUserId },
            ],
        })
        .sort({ createdAt: 'asc' }) // Sort by oldest first
        .populate('sender', 'username'); // Populate sender info

        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get messages for a specific room
// @route   GET /api/messages/room/:roomId
exports.getRoomMessages = async (req, res) => {
    try {
        const messages = await Message.find({ room: req.params.roomId })
            .sort({ createdAt: 'asc' })
            .populate('sender', 'username');
        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};