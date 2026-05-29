const Route = require('../models/Route');
const Checkpoint = require('../models/Checkpoint');
const Place = require('../models/Place');

const getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find()
      .populate('endPlaceId', 'name type coordinates');
    res.status(200).json({
      status: 'success',
      count: routes.length,
      data: routes
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch routes',
      error: error.message
    });
  }
};

const getRouteById = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id)
      .populate('endPlaceId', 'name type coordinates');
    
    if (!route) {
      return res.status(404).json({
        status: 'error',
        message: 'Route not found'
      });
    }

    const checkpoints = route.waypoints || [];

    res.status(200).json({
      status: 'success',
      data: {
        route,
        checkpoints
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch route',
      error: error.message
    });
  }
};

const createRoute = async (req, res) => {
  try {
    const route = await Route.create(req.body);
    res.status(201).json({
      status: 'success',
      data: route
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Failed to create route',
      error: error.message
    });
  }
};

const createCheckpoint = async (req, res) => {
  try {
    const checkpoint = await Checkpoint.create(req.body);
    res.status(201).json({
      status: 'success',
      data: checkpoint
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Failed to create checkpoint',
      error: error.message
    });
  }
};

const getAllPlaces = async (req, res) => {
  try {
    const places = await Place.find().sort({ type: 1, name: 1 }).lean();
    res.status(200).json({
      status: 'success',
      count: places.length,
      data: places
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch places',
      error: error.message
    });
  }
};

const createPlace = async (req, res) => {
  try {
    const place = await Place.create(req.body);
    res.status(201).json({
      status: 'success',
      data: place
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Failed to create place',
      error: error.message
    });
  }
};

const getRoute = async (req, res) => {
  try {
    const { userLatitude, userLongitude, destinationPlaceId } = req.body;
    
    if (!destinationPlaceId) {
      return res.status(400).json({
        status: 'error',
        message: 'destinationPlaceId is required'
      });
    }

    // Find route ending at destinationPlaceId
    const route = await Route.findOne({ endPlaceId: destinationPlaceId }).lean();
      
    if (!route) {
      return res.status(404).json({
        status: 'error',
        message: 'Route not found for this destination'
      });
    }

    // Define user starting waypoint
    const startLat = userLatitude ? parseFloat(userLatitude) : 0.0;
    const startLng = userLongitude ? parseFloat(userLongitude) : 0.0;
    
    const startWaypoint = {
      latitude: startLat,
      longitude: startLng,
      turnType: 'STRAIGHT',
      landmarkName: 'Your Location',
      customInstruction: 'Start walking towards the campus route'
    };

    // Prepend user current coordinates as index 0 (fluid starting vector)
    const checkpoints = [startWaypoint, ...(route.waypoints || [])];

    res.status(200).json({
      status: 'success',
      data: {
        route: {
          ...route,
          waypoints: checkpoints
        },
        checkpoints
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch route details',
      error: error.message
    });
  }
};

module.exports = {
  getAllRoutes,
  getRouteById,
  createRoute,
  createCheckpoint,
  getAllPlaces,
  createPlace,
  getRoute
};
