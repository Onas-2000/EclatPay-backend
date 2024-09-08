const User = require('../models/user');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

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
      password: await bcrypt.hash(password, 10), // Extract 10 to an env variable if needed
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
      from: process.env.EMAIL_USER || 'exploblog111@gmail.com', // Better to use env variable
      to: email,
      subject: 'Welcome to Eclatpay',
      text: 'Thank you for signing up!',
    };

    // Email sending logic
    try {
      const info = await transporter.sendMail(mailOptions);
      if (process.env.NODE_ENV !== 'test') {
        console.log('Email sent: ' + info.response);
      }
    } catch (error) {
      console.error('Error sending email:', error.message);
      // Optionally, notify the user that registration succeeded but email failed
      return res.status(201).json({
        msg: 'User registered successfully, but email sending failed.',
        emailError: error.message, // You can remove this in production
      });
    }

    // Successful response if everything went fine
    return res.status(201).json({ msg: 'User registered successfully, an email has been sent.' });
  } catch (err) {
    console.error('Server error:', err.message);
    return res.status(500).json({ msg: 'Server error' }); // Consistent JSON error message
  }
};

module.exports = {
  registerUserController,
};
