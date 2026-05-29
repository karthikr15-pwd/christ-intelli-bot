const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  endPlaceId: {
    type: String,
    ref: 'Place',
    required: true
  },
  waypoints: [{
    latitude: Number,
    longitude: Number,
    turnType: { type: String, enum: ['STRAIGHT', 'LEFT', 'RIGHT', 'ARRIVED'] },
    landmarkName: String,
    customInstruction: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Route', routeSchema);
