const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  darkMode: {
    type: Boolean,
    default: false
  },
  notificationsEnabled: {
    type: Boolean,
    default: true
  },
  emailNotifications: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('Settings', SettingsSchema);
