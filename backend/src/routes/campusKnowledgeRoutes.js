const express = require('express');
const { getCampusKnowledgeByCategory, createCampusKnowledge, deleteCampusKnowledge } = require('../controllers/CampusKnowledgeController');

const router = express.Router();

router
  .route('/category/:categoryName')
  .get(getCampusKnowledgeByCategory);

router
  .route('/add')
  .post(createCampusKnowledge);

router
  .route('/delete/:id')
  .delete(deleteCampusKnowledge);

module.exports = router;
