const express = require('express');
const router = express.Router();
const { getMessages, getRoomMessages } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// This route will be prefixed with /api
router.get('/messages/:otherUserId', protect, getMessages);
router.get('/messages/room/:roomId', protect, getRoomMessages);
module.exports = router;