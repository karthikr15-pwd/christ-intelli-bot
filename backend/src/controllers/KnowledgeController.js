const Knowledge = require('../models/Knowledge');

// Get all knowledge items
exports.getAllKnowledge = async (req, res) => {
  try {
    const items = await Knowledge.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Create a new knowledge item
exports.createKnowledge = async (req, res) => {
  try {
    const item = await Knowledge.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete a knowledge item
exports.deleteKnowledge = async (req, res) => {
  try {
    const item = await Knowledge.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Knowledge item not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
