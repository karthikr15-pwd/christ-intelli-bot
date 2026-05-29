const express = require('express');
const router = express.Router();
const {
  getAllRoutes,
  getRouteById,
  createRoute,
  createCheckpoint,
  getAllPlaces,
  createPlace,
  getRoute
} = require('../controllers/NavigationController');

router.get('/routes', getAllRoutes);
router.get('/routes/:id', getRouteById);
router.post('/routes', createRoute);
router.post('/checkpoints', createCheckpoint);
router.get('/places', getAllPlaces);
router.post('/places', createPlace);
router.post('/route', getRoute);

module.exports = router;
