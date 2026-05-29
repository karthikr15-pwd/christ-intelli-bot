const mongoose = require('mongoose');

const campusInformationSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['ACADEMICS', 'EVENTS_ANNOUNCEMENTS', 'INFRASTRUCTURE', 'IT_SUPPORT', 'EMERGENCY']
  },
  subCategory: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  contentDetails: {
    type: String,
    required: true
  },
  expiryDate: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CampusInformation', campusInformationSchema);
