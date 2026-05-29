const express = require('express');
const { getAllKnowledge, createKnowledge, deleteKnowledge } = require('../controllers/KnowledgeController');

const router = express.Router();

router
  .route('/')
  .get(getAllKnowledge)
  .post(createKnowledge);

router
  .route('/:id')
  .delete(deleteKnowledge);

module.exports = router;
