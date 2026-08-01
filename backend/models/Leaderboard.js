const mongoose = require('mongoose');

const LeaderboardEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  timeTaken: {
    type: Number, // in seconds
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const LeaderboardSchema = new mongoose.Schema({
  level: {
    type: String,
    required: true,
    unique: true,
    enum: ['Basic', 'Intermediate', 'Advance', 'Company Related', 'Government Exams']
  },
  entries: [LeaderboardEntrySchema]
});

module.exports = mongoose.model('Leaderboard', LeaderboardSchema);
