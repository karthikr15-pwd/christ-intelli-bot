const mongoose = require('mongoose');

const canteenSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ["MBA Canteen", "KN'S", "South Canteen", "North Canteen"],
    required: true,
    unique: true
  },
  coverImageUrl: {
    type: String,
    required: true
  },
  operatingHours: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Canteen', canteenSchema);
