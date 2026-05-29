const CampusInformation = require('../models/CampusInformation');

// Fetch by Category
exports.getCampusKnowledgeByCategory = async (req, res) => {
  try {
    const { categoryName } = req.params;
    const now = new Date();
    
    const items = await CampusInformation.find({
      category: categoryName,
      $or: [
        { expiryDate: { $gte: now } },
        { expiryDate: null },
        { expiryDate: { $exists: false } }
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Create Record
exports.createCampusKnowledge = async (req, res) => {
  try {
    const item = await CampusInformation.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete Node
exports.deleteCampusKnowledge = async (req, res) => {
  try {
    const item = await CampusInformation.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Knowledge item not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
