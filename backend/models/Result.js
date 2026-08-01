const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuizSession',
    required: true
  },
  level: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    default: 10
  },
  percentage: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    required: true
  },
  incorrectAnswers: {
    type: Number,
    required: true
  },
  timeTaken: {
    type: Number, // in seconds
    required: true
  },
  accuracy: {
    type: Number, // percentage
    required: true
  },
  performanceRating: {
    type: String,
    required: true,
    enum: ['Excellent', 'Very Good', 'Good', 'Average', 'Needs Improvement']
  },
  analysis: {
    strongTopics: [String],
    weakTopics: [String],
    learningSuggestions: [String],
    difficultyAnalysis: String,
    recommendedNextLevel: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Result', ResultSchema);
