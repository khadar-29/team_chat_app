const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');

// @route   GET api/messages/:channelId
// @desc    Get messages for channel with pagination
router.get('/:channelId', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ channel: req.params.channelId })
      .populate('sender', 'username')
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip);

    res.json(messages.reverse()); // Reverse to show oldest first
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
