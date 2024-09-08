const mongoose = require('mongoose');
const app = require('./index'); // Import the app from index.js

const PORT = process.env.PORT || 10000; // Default port if not specified
const dbURI = process.env.MONGO_URI;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(dbURI);
    console.log('MongoDB connected');

    // Start the server
    app.listen(PORT, '0.0.0.0', () => { // Bind to 0.0.0.0
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process with failure
  }
};

startServer();
