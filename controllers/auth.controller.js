const User = require('../models/user');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;

const registerUserController = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create new user and hash the password
    user = new User({
      email,
      password: await bcrypt.hash(password, 10), // Hash the password
    });

    // Save the user to the database
    await user.save();

    // Set up email transport
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER || 'exploblog111@gmail.com', // Use env variable
      to: email,
      subject: 'Welcome to Eclatpay',
      text: 'Thank you for signing up!',
    };

    // Send email notification
    try {
      const info = await transporter.sendMail(mailOptions);
      if (process.env.NODE_ENV !== 'test') {
        console.log('Email sent: ' + info.response);
      }
    } catch (error) {
      console.error('Error sending email:', error.message);
      // Notify that registration succeeded but email sending failed
      return res.status(201).json({
        msg: 'User registered successfully, but email sending failed.',
        emailError: error.message, // Remove this in production if necessary
      });
    }

    // Generate JWT Token
    const payload = { user: { id: user.id } };

    jwt.sign(
      payload,
      jwtSecret, // Use the secret from the .env file
      { expiresIn: '1h' }, // Token expires in 1 hour
      (err, token) => {
        if (err) throw err;

        // Send the token to the frontend with the success message
        return res.status(201).json({
          msg: 'User registered successfully, an email has been sent.',
          token,
        });
      }
    );
  } catch (err) {
    console.error('Server error:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
  registerUserController,
};
