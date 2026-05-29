const express = require('express');
const router = express.Router();
const {
  getAllCanteens,
  createCanteen,
  getMenuItemsByCanteen,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  searchMenuItems
} = require('../controllers/CanteenController');

router.get('/search', searchMenuItems);

router.route('/')
  .get(getAllCanteens)
  .post(createCanteen);

router.route('/:canteenId/items')
  .get(getMenuItemsByCanteen)
  .post(addMenuItem);

router.route('/items/:itemId')
  .put(updateMenuItem)
  .delete(deleteMenuItem);

module.exports = router;
