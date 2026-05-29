const Place = require('../models/Place');
const CollegeKnowledge = require('../models/CollegeKnowledge');

const addPlace = async (req, res) => {
  try {
    const { name, category, latitude, longitude, requiresIndoorNav, entranceLatitude, entranceLongitude, floorLevel, roomNumber, indoorDirections } = req.body;
    
    const parsedFloorLevel = floorLevel !== undefined && floorLevel !== '' ? Number(floorLevel) : undefined;

    const place = await Place.create({
      name,
      category,
      latitude,
      longitude,
      requiresIndoorNav,
      entranceLatitude,
      entranceLongitude,
      floorLevel: parsedFloorLevel,
      roomNumber,
      indoorDirections
    });

    res.status(201).json({
      status: 'success',
      message: 'Location Live on Campus Map!',
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

const getAllPlaces = async (req, res) => {
  try {
    const places = await Place.find().sort({ category: 1, name: 1 }).lean();
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

const uploadKnowledge = async (req, res) => {
  try {
    const { category, title, corpus } = req.body;
    
    const knowledge = await CollegeKnowledge.create({
      category,
      title,
      corpus
    });

    res.status(201).json({
      status: 'success',
      message: 'Data successfully uploaded to AI Brain',
      data: knowledge
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Failed to upload knowledge',
      error: error.message
    });
  }
};

module.exports = {
  addPlace,
  getAllPlaces,
  uploadKnowledge
};
