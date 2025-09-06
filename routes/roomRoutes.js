const express = require('express');
const router = express.Router();
const { createRoom, getRooms, addMember, removeMember, deleteRoom } = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');

// Route for creating a room and getting all rooms
router.route('/').post(protect, createRoom).get(protect, getRooms);
router.route('/:roomId').delete(protect, deleteRoom);
router.route('/:roomId/members').put(protect, addMember);
router.route('/:roomId/members/:userId').delete(protect, removeMember);
module.exports = router;