const mongoose = require('mongoose');

const checkpointSchema = new mongoose.Schema({
  routeId: {
    type: String,
    ref: 'Route',
    required: true
  },
  stepOrder: {
    type: Number,
    required: true
  },
  landmarkName: {
    type: String,
    required: true,
    trim: true
  },
  instruction: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Checkpoint', checkpointSchema);
