const express = require('express');
const router = express.Router();
const ChatbotController = require('../controllers/ChatbotController');

router.post('/', ChatbotController.processMessage);

module.exports = router;
