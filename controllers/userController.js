const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Password validation function
const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one digit (0-9)');
    }
    
    return errors;
};

// Username validation function
const validateUsername = (username) => {
    const errors = [];
    
    if (username.length < 3) {
        errors.push('Username must be at least 3 characters long');
    }
    
    if (username.length > 20) {
        errors.push('Username must be less than 20 characters');
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errors.push('Username can only contain letters, numbers, and underscores');
    }
    
    return errors;
};

// @desc    Register a new user
// @route   POST /register
exports.registerUser = async (req, res) => {
    const { username, password } = req.body;

    // Check if all fields are provided
    if (!username || !password) {
        return res.status(400).render('register', { 
            error: 'Please enter all fields',
            username: username || '',
            password: password || ''
        });
    }

    // Validate username
    const usernameErrors = validateUsername(username);
    if (usernameErrors.length > 0) {
        return res.status(400).render('register', { 
            error: usernameErrors[0],
            username: username,
            password: password
        });
    }

    // Validate password
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
        return res.status(400).render('register', { 
            error: passwordErrors[0],
            username: username,
            password: password
        });
    }

    // Check if username already exists
    const userExists = await User.findOne({ username });
    if (userExists) {
        return res.status(400).render('register', { 
            error: 'Username already taken. Please choose another.',
            username: username,
            password: password
        });
    }

    try {
        const user = await User.create({ username, password });

        if (user) {
            const token = generateToken(user._id);
            res.cookie('token', token, {
                httpOnly: true,
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            });
            res.redirect('/chat');
        } else {
            res.status(400).render('register', { 
                error: 'Invalid user data',
                username: username,
                password: password
            });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).render('register', { 
            error: 'Server error. Please try again.',
            username: username,
            password: password
        });
    }
};

// @desc    Authenticate user & get token
// @route   POST /login
exports.loginUser = async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(password))) {
        const token = generateToken(user._id);
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60 * 1000
        });
        res.redirect('/chat');
    } else {
        res.status(401).render('index', { error: 'Invalid username or password' });
    }
};

// @desc    Logout user
// @route   POST /logout
exports.logoutUser = (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0),
    });
    res.redirect('/');
};

// @desc    Render chat page
// @route   GET /chat
exports.getChatPage = async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.user.id } }).select('-password');
        res.render('chat', {
            currentUser: req.user,
            users: users
        });
    } catch (error) {
        console.error(error);
        res.redirect('/?error=Something went wrong');
    }
};

// @desc    Render register page
// @route   GET /register
exports.getRegisterPage = (req, res) => {
    res.render('register', { error: null });
};

// @desc    Render login page
// @route   GET /
exports.getLoginPage = (req, res) => {
    res.render('index', { error: req.query.error || null });
};

// @desc    Get all users
// @route   GET /api/users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};