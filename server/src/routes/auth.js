const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_secret';

// Generate tokens
const generateTokens = (userId) => {
    const accessToken = jwt.sign({ id: userId }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: userId }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

// Register
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    console.log('Register attempt:', { name, email });
    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        const { accessToken, refreshToken } = generateTokens(user._id);

        // Store refresh token
        user.refreshToken = refreshToken;
        await user.save();

        res.status(201).json({
            accessToken,
            refreshToken,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: error.message, stack: error.stack });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && (await bcrypt.compare(password, user.password))) {
            const { accessToken, refreshToken } = generateTokens(user._id);

            // Store refresh token
            user.refreshToken = refreshToken;
            await user.save();

            res.json({
                accessToken,
                refreshToken,
                user: { id: user._id, name: user.name, email: user.email }
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Refresh token
router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token required' });
    }

    try {
        const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

        // Update refresh token
        user.refreshToken = newRefreshToken;
        await user.save();

        res.json({ accessToken, refreshToken: newRefreshToken });
    } catch (error) {
        res.status(403).json({ message: 'Invalid or expired refresh token' });
    }
});

// Logout
router.post('/logout', async (req, res) => {
    const { refreshToken } = req.body;

    try {
        if (refreshToken) {
            const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
            const user = await User.findById(decoded.id);
            if (user) {
                user.refreshToken = null;
                await user.save();
            }
        }
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.json({ message: 'Logged out successfully' });
    }
});

module.exports = router;
