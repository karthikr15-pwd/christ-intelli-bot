const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');

router.get('/', AdminController.getAllPlaces);
router.post('/', AdminController.addPlace);
router.post('/knowledge', AdminController.uploadKnowledge);

module.exports = router;
