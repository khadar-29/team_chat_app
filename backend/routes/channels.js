const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Channel = require('../models/Channel');

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
      isJoined: channel.members.some(member => member._id.toString() === req.user.id.toString())
    }));

    res.json({
      allChannels: channelsWithStatus,
      userChannels,
      totalChannels: channelsWithStatus.length
    });
  } catch (error) {
    console.error('Channels error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST create channel
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Channel name must be 2+ characters' });
    }

    const existing = await Channel.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });
    if (existing) {
      return res.status(400).json({ message: 'Channel name already exists' });
    }

    const channel = new Channel({
      name: name.trim(),
      createdBy: req.user.id,
      members: [req.user.id]
    });

    await channel.save();
    const populated = await Channel.findById(channel._id)
      .populate('createdBy', 'username')
      .populate('members', 'username');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST join channel
router.post('/:id/join', auth, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    const userIdStr = req.user.id.toString();
    if (!channel.members.some(m => m._id.toString() === userIdStr)) {
      channel.members.push(req.user.id);
      await channel.save();
    }

    const populated = await Channel.findById(channel._id)
      .populate('createdBy', 'username')
      .populate('members', 'username');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST leave channel
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    const userIdStr = req.user.id.toString();
    channel.members = channel.members.filter(m => m._id.toString() !== userIdStr);
    await channel.save();
    res.json({ message: 'Left channel' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
