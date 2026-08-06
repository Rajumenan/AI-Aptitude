const User = require('../models/User');
const Settings = require('../models/Settings');
const Result = require('../models/Result');
const Certificate = require('../models/Certificate');

// @desc    Get user profile details & performance stats
// @route   GET /api/profile/me
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user details
    const user = await User.findById(userId).select('-password -otp');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get user settings
    let settings = await Settings.findOne({ userId });
    if (!settings) {
      settings = await Settings.create({ userId });
    }

    // Get user quiz performance statistics
    const results = await Result.find({ userId });
    const totalQuizzes = results.length;
    
    let averageScore = 0;
    let averageAccuracy = 0;
    let totalTimeSpent = 0;

    if (totalQuizzes > 0) {
      const sumScores = results.reduce((acc, r) => acc + r.score, 0);
      const sumAccuracy = results.reduce((acc, r) => acc + r.accuracy, 0);
      totalTimeSpent = results.reduce((acc, r) => acc + r.timeTaken, 0);
      
      averageScore = parseFloat((sumScores / totalQuizzes).toFixed(1));
      averageAccuracy = parseFloat((sumAccuracy / totalQuizzes).toFixed(1));
    }

    // Get user certificates
    const certificates = await Certificate.find({ userId });

    res.status(200).json({
      success: true,
      profile: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt
      },
      settings: {
        darkMode: settings.darkMode,
        notificationsEnabled: settings.notificationsEnabled,
        emailNotifications: settings.emailNotifications
      },
      stats: {
        totalQuizzes,
        averageScore,
        averageAccuracy,
        totalTimeSpent,
        certificatesCount: certificates.length,
        tokens: user.tokens || 0,
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0
      },
      certificates: certificates.map(c => ({
        certificateId: c.certificateId,
        level: c.level,
        score: c.score,
        dateGenerated: c.dateGenerated
      }))
    });
  } catch (error) {
    console.error('Get Profile Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving profile' });
  }
};

// @desc    Update user profile username
// @route   PUT /api/profile/update
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user._id;

    if (!username) {
      return res.status(400).json({ success: false, message: 'Please provide a username' });
    }

    // Check if username is already taken
    const existingUser = await User.findOne({ username, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username is already taken' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email
      }
    });
  } catch (error) {
    console.error('Update Profile Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
};

// @desc    Get user preferences
// @route   GET /api/profile/settings
// @access  Private
exports.getSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    let settings = await Settings.findOne({ userId });

    if (!settings) {
      settings = await Settings.create({ userId });
    }

    res.status(200).json({
      success: true,
      settings: {
        darkMode: settings.darkMode,
        notificationsEnabled: settings.notificationsEnabled,
        emailNotifications: settings.emailNotifications
      }
    });
  } catch (error) {
    console.error('Get Settings Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching settings' });
  }
};

// @desc    Update user preferences (e.g. Dark Mode)
// @route   PUT /api/profile/settings
// @access  Private
exports.updateSettings = async (req, res) => {
  try {
    const { darkMode, notificationsEnabled, emailNotifications } = req.body;
    const userId = req.user._id;

    let settings = await Settings.findOne({ userId });
    if (!settings) {
      settings = new Settings({ userId });
    }

    if (darkMode !== undefined) settings.darkMode = darkMode;
    if (notificationsEnabled !== undefined) settings.notificationsEnabled = notificationsEnabled;
    if (emailNotifications !== undefined) settings.emailNotifications = emailNotifications;

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      settings: {
        darkMode: settings.darkMode,
        notificationsEnabled: settings.notificationsEnabled,
        emailNotifications: settings.emailNotifications
      }
    });
  } catch (error) {
    console.error('Update Settings Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating settings' });
  }
};
