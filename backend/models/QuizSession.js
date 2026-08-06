const mongoose = require('mongoose');

const QuestionStateSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: {
    type: Map,
    of: String,
    required: true
  },
  correctOption: { type: String, required: true }, // 'A', 'B', 'C', or 'D'
  explanation: { type: String, required: true },
  topic: { type: String, required: true }
});

const QuizSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  level: {
    type: String,
    required: true,
    enum: ['Basic', 'Intermediate', 'Advance', 'Company Related', 'Government Exams']
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed'],
    default: 'in-progress'
  },
  questions: [QuestionStateSchema], // 10 AI-generated questions
  answers: {
    type: [String], // User answers (A, B, C, D, or null if skipped)
    default: []
  },
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  score: {
    type: Number,
    default: 0
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  }
});

QuizSessionSchema.index({ userId: 1, startTime: -1 });

module.exports = mongoose.model('QuizSession', QuizSessionSchema);
