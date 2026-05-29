const Faculty = require('../models/Faculty');

const getAllFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.find().sort({ department: 1, name: 1 });
    res.status(200).json({
      status: 'success',
      count: faculty.length,
      data: faculty
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch faculty',
      error: error.message
    });
  }
};

const getFacultyById = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({
        status: 'error',
        message: 'Faculty not found'
      });
    }
    res.status(200).json({
      status: 'success',
      data: faculty
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch faculty',
      error: error.message
    });
  }
};

const coordinateDictionary = {
  'Block 1': { lat: 12.86306196225806, lng: 77.43789140591163 },
  'Block 2': { lat: 12.862881814825599, lng: 77.43834793241692 },
  'Block 3': { lat: 12.862610397105067, lng: 77.43882750868181 },
  'Block 4': { lat: 12.862298813826037, lng: 77.43912351433681 },
  'Block 5': { lat: 12.861903349126772, lng: 77.43856430676887 },
  'Block 6': { lat: 12.862219720936048, lng: 77.43975805556676 },
  'Devadan Hall': { lat: 12.860301710675602, lng: 77.43944513123255 },
  'Architecture Block': { lat: 12.860167985082313, lng: 77.4384040221482 }
};

const createFaculty = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.blockName && coordinateDictionary[payload.blockName]) {
      payload.latitude = coordinateDictionary[payload.blockName].lat;
      payload.longitude = coordinateDictionary[payload.blockName].lng;
    } else if (!payload.latitude || !payload.longitude) {
      return res.status(400).json({ status: 'error', message: 'Invalid or missing blockName for coordinates' });
    }

    const faculty = await Faculty.create(payload);
    res.status(201).json({
      status: 'success',
      data: faculty
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Failed to create faculty',
      error: error.message
    });
  }
};

const updateFaculty = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.blockName && coordinateDictionary[payload.blockName]) {
      payload.latitude = coordinateDictionary[payload.blockName].lat;
      payload.longitude = coordinateDictionary[payload.blockName].lng;
    }

    const faculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );
    if (!faculty) {
      return res.status(404).json({
        status: 'error',
        message: 'Faculty not found'
      });
    }
    res.status(200).json({
      status: 'success',
      data: faculty
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Failed to update faculty',
      error: error.message
    });
  }
};

const deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndDelete(req.params.id);
    if (!faculty) {
      return res.status(404).json({
        status: 'error',
        message: 'Faculty not found'
      });
    }
    res.status(200).json({
      status: 'success',
      message: 'Faculty deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete faculty',
      error: error.message
    });
  }
};

module.exports = {
  getAllFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty
};
