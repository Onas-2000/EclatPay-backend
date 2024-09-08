const request = require('supertest');
const app = require('../index'); // Adjust path to your app entry point
const User = require('../models/user'); // Mock the User model
const nodemailer = require('nodemailer');

describe('POST /register', () => {

  it('should register a new user successfully and send an email', async () => {
    // Mock the User.findOne and save methods
    const findOneSpy = jest.spyOn(User, 'findOne').mockResolvedValue(null);
    const saveSpy = jest.spyOn(User.prototype, 'save').mockResolvedValue({});

    // Mock nodemailer
    const sendMailMock = jest.fn().mockResolvedValue('Email sent');
    const createTransportSpy = jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: sendMailMock
    });

    const res = await request(app)
      .post('/register')
      .send({ email: 'lab3dynamics@gmail.com', password: 'password123' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('msg', 'User registered successfully, an email has been sent.');
    expect(sendMailMock).toHaveBeenCalled();

    // Restore spies after the test
    findOneSpy.mockRestore();
    saveSpy.mockRestore();
    createTransportSpy.mockRestore();
  });

  it('should return 400 if user already exists', async () => {
    const findOneSpy = jest.spyOn(User, 'findOne').mockResolvedValue({ email: 'test@example.com' });

    const res = await request(app)
      .post('/register')
      .send({ email: 'lab3dynamics@gmail.com', password: 'password123' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('msg', 'User already exists');

    // Restore spy
    findOneSpy.mockRestore();
  });

  it('should handle server errors gracefully', async () => {
    // Mock User.findOne to simulate a server error during the database query
    const findOneSpy = jest.spyOn(User, 'findOne').mockRejectedValueOnce(new Error('Server error'));

    const res = await request(app).post('/register').send({
      email: 'lab3dynamics@gmail.com',
      password: 'password123',
    });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('msg', 'Server error');

    // Restore the spy after the test completes
    findOneSpy.mockRestore();
  }, 10000);  // Increase the test timeout to 10 seconds
});
