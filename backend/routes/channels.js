// backend/routes/channels.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Channel = require('../models/Channel');

// Helper to safely get member id as string
const getMemberId = (member) =>
  (member && member._id ? member._id.toString() : member.toString());

// GET all channels
router.get('/', auth, async (req, res) => {
  try {
    const allChannels = await Channel.find({})
      .populate('createdBy', 'username')
      .populate('members', 'username')
      .sort({ createdAt: -1 })
      .lean();

    const userChannels = await Channel.find({ members: req.user.id })
      .populate('createdBy', 'username')
      .populate('members', 'username')
      .lean();

    const channelsWithStatus = allChannels.map(channel => ({
      _id: channel._id,
      name: channel.name,
      description: channel.description || '',
      isPrivate: channel.isPrivate || false,
      createdBy: channel.createdBy,
      membersCount: channel.members.length,
      members: channel.members,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
      isJoined: channel.members.some(member => getMemberId(member) === req.user.id.toString())
    }));

    res.json({
      allChannels: channelsWithStatus,
      userChannels,
      totalChannels: channelsWithStatus.length
    });
  } catch (error) {
    console.error('🚨 Channels error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// JOIN channel
router.post('/:id/join', auth, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    const userIdStr = req.user.id.toString();
    const alreadyJoined = channel.members.some(m => getMemberId(m) === userIdStr);

    if (!alreadyJoined) {
      channel.members.push(req.user.id);
      await channel.save();
      console.log(`✅ ${userIdStr} joined #${channel.name}`);
    }

    const populated = await Channel.findById(channel._id)
      .populate('createdBy', 'username')
      .populate('members', 'username');

    res.json(populated);
  } catch (error) {
    console.error('🚨 Join error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// LEAVE channel
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    const userIdStr = req.user.id.toString();
    const isMember = channel.members.some(m => getMemberId(m) === userIdStr);

    if (!isMember) {
      return res.status(400).json({ message: 'You are not a member of this channel' });
    }

    // Prevent removing the only member if they are the creator (optional rule)
    if (channel.members.length === 1 && channel.createdBy.toString() === userIdStr) {
      return res.status(400).json({ message: 'Cannot leave as you are the only member and creator' });
    }

    channel.members = channel.members.filter(m => getMemberId(m) !== userIdStr);
    await channel.save();

    console.log(`👋 ${userIdStr} left #${channel.name}`);
    res.json({ message: 'Left channel successfully', channelId: channel._id });
  } catch (error) {
    console.error('🚨 Leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
