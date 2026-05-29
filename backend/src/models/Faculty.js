const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  blockName: {
    type: String,
    required: true,
    trim: true
  },
  floorLevel: {
    type: String,
    required: true,
    trim: true
  },
  cabinNumber: {
    type: String,
    trim: true
  },
  staffroomNumber: {
    type: String,
    trim: true
  },
  timings: {
    type: String,
    required: true,
    trim: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Faculty', facultySchema);
