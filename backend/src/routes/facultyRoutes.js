const express = require('express');
const router = express.Router();
const {
  getAllFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty
} = require('../controllers/FacultyController');

router.route('/')
  .get(getAllFaculty)
  .post(createFaculty);

router.route('/:id')
  .get(getFacultyById)
  .put(updateFaculty)
  .delete(deleteFaculty);

module.exports = router;
