const Canteen = require('../models/Canteen');
const MenuItem = require('../models/MenuItem');

const getAllCanteens = async (req, res) => {
  try {
    const canteens = await Canteen.find().sort({ name: 1 });
    res.status(200).json({
      status: 'success',
      count: canteens.length,
      data: canteens
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch canteens',
      error: error.message
    });
  }
};

const createCanteen = async (req, res) => {
  try {
    const canteen = await Canteen.create(req.body);
    res.status(201).json({
      status: 'success',
      data: canteen
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Failed to create canteen',
      error: error.message
    });
  }
};

const getMenuItemsByCanteen = async (req, res) => {
  try {
    const items = await MenuItem.find({ canteenId: req.params.canteenId }).sort({ category: 1, name: 1 });
    res.status(200).json({
      status: 'success',
      count: items.length,
      data: items
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch menu items',
      error: error.message
    });
  }
};

const addMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.create({
      ...req.body,
      canteenId: req.params.canteenId
    });
    res.status(201).json({
      status: 'success',
      data: item
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Failed to add menu item',
      error: error.message
    });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(
      req.params.itemId,
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: 'Menu item not found'
      });
    }
    res.status(200).json({
      status: 'success',
      data: item
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Failed to update menu item',
      error: error.message
    });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.itemId);
    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: 'Menu item not found'
      });
    }
    res.status(200).json({
      status: 'success',
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete menu item',
      error: error.message
    });
  }
};

const searchMenuItems = async (req, res) => {
  try {
    const query = req.query.q || '';
    if (!query) {
      return res.status(200).json({ status: 'success', data: [] });
    }
    
    // Case-insensitive regex search in name and description
    const regex = new RegExp(query, 'i');
    const items = await MenuItem.find({
      $or: [
        { name: regex },
        { description: regex }
      ]
    }).populate('canteenId', 'name').sort({ name: 1 });
    
    res.status(200).json({
      status: 'success',
      count: items.length,
      data: items
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Search failed',
      error: error.message
    });
  }
};

module.exports = {
  getAllCanteens,
  createCanteen,
  getMenuItemsByCanteen,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  searchMenuItems
};
