const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    logoutUser,
    getChatPage,
    getRegisterPage,
    getLoginPage
} = require('../controllers/userController');
const { getAllUsers } = require('../controllers/userController'); 
const { protect } = require('../middleware/authMiddleware');

router.get('/', getLoginPage);
router.get('/register', getRegisterPage);
router.get('/chat', protect, getChatPage);
router.get('/api/users', protect, getAllUsers);

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

module.exports = router;