require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const app = express();
// const User = require('../models/user'); 
const { registerUserController } = require('./controllers/auth.controller')

const dbURI = process.env.MONGO_URI;
const jwtSecret = process.env.JWT_SECRET; // Get the JWT secret from .env

app.use(express.json());

const User = require('./models/user');
const { loginUserController } = require('./controllers/user.controller');

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.post('/register', registerUserController);

app.post('/login', loginUserController);

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Example of a protected route
app.get('/protected', authenticateToken, (req, res) => {
  res.send('This is a protected route');
});

// Forgot Password Route
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'User not found' });
    }

    // Generate token
    const token = crypto.randomBytes(20).toString('hex');

    // Set reset token and expiry
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // Send email with reset link containing the token
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    });

    const mailOptions = {
      from: 'exploblog111@gmail.com',
      to: user.email,
      subject: 'Password Reset',
      text: `You are receiving this because you (or someone else) have requested to reset the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        http://localhost:3001/reset-password/${token}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ msg: 'Error sending email' });
      }
      res.json({ msg: 'Password reset email sent successfully' });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Reset Password Route
app.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;  // Token from URL params
  const { password } = req.body; // New password from request body

  try {
    console.log('Received Token:', token); // Log the token received from URL

    // Find the user by the reset token and ensure the token has not expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // Check if the token has not expired
    });

    console.log('User Found:', user); // Log the user found

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired token' });
    }

    // If the user is found, hash the new password and update the user's password
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;  // Clear the reset token
    user.resetPasswordExpires = undefined;  // Clear the token expiry time

    await user.save();

    res.status(200).json({ msg: 'Password has been reset successfully' });
  } catch (err) {
    console.error('Error resetting password:', err.message);
    res.status(500).send('Server error');
  }
});

// Export the app object for testing
module.exports = app;
