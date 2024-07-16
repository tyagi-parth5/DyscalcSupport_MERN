import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_URL,
}));

const MONGO_URL = process.env.MONGO_URL;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB', error);
    process.exit(1);
  }
};

connectDB();

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
});

const User = mongoose.model('User', userSchema);

const QuizSchema = new mongoose.Schema({
  userId: String,
  answers: [String],
  correctAnswers: [String],
  timeSpent: Number,
  timePerQuestion: [Number],
  date: { type: Date, default: Date.now }
});

const Quiz = mongoose.model('Quiz', QuizSchema);

app.post('/submitQuiz', async (req, res) => {
  const { userId, answers, correctAnswers, timeSpent, timePerQuestion } = req.body;

  const newQuiz = new Quiz({
    userId,
    answers,
    correctAnswers,
    timeSpent,
    timePerQuestion
  });

  try {
    await newQuiz.save();
    res.status(200).send('Quiz submitted successfully');
  } catch (error) {
    res.status(500).send('Error submitting quiz');
  }
});

app.get('/getReports/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const reports = await Quiz.find({ userId });
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).send('Error fetching reports');
  }
});

app.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (user) {
        if (password === user.password) {
          res.send({ message: "Login Successful", user });
        } else {
          res.status(401).send({ message: "Password didn't match" });
        }
      } else {
        res.status(404).send({ message: "User not registered" });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).send({ message: "Internal server error" });
    }
});
  
app.post("/register", async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).send({ message: "User already registered" });
      } else {
        const newUser = new User({ name, email, password });
        await newUser.save();
        res.status(201).send({ message: "Successfully Registered, Please login now." });
      }
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).send({ message: "Internal server error" });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
