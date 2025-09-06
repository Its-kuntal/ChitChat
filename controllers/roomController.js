const Room = require('../models/roomModel');

// @desc    Create a new room
// @route   POST /api/rooms
exports.createRoom = async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Please enter a room name' });
    }

    try {
        const newRoom = await Room.create({
            name,
            creator: req.user.id,
            members: [req.user.id], // The creator is automatically a member
        });
        res.status(201).json(newRoom);
    } catch (error) {
        // Handle case where room name is not unique
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A room with this name already exists.' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all rooms a user is a member of
// @route   GET /api/rooms
exports.getRooms = async (req, res) => {
    try {
        const rooms = await Room.find({ members: req.user.id });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Add a member to a room
// @route   PUT /api/rooms/:roomId/members
exports.addMember = async (req, res) => {
    const { userId } = req.body;
    const { roomId } = req.params;

    try {
        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Check if the user making the request is the creator of the room
        if (room.creator.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only the room creator can add members' });
        }

        // Use $addToSet to add the user to the members array, preventing duplicates
        await Room.findByIdAndUpdate(roomId, { $addToSet: { members: userId } });

        res.json({ message: 'Member added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Remove a member from a room
// @route   DELETE /api/rooms/:roomId/members/:userId
exports.removeMember = async (req, res) => {
    const { roomId, userId } = req.params;

    try {
        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Check if the user making the request is the creator of the room
        if (room.creator.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only the room creator can remove members' });
        }

        // Check if the user to be removed is the creator
        if (room.creator.toString() === userId) {
            return res.status(400).json({ message: 'Room creator cannot be removed from the room' });
        }

        // Remove the user from the members array
        await Room.findByIdAndUpdate(roomId, { $pull: { members: userId } });

        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a room
// @route   DELETE /api/rooms/:roomId
exports.deleteRoom = async (req, res) => {
    const { roomId } = req.params;

    try {
        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Check if the user making the request is the creator of the room
        if (room.creator.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only the room creator can delete the room' });
        }

        // Delete the room
        await Room.findByIdAndDelete(roomId);

        res.json({ message: 'Room deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};