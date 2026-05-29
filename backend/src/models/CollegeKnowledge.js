const mongoose = require('mongoose');

const collegeKnowledgeSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['Admissions', 'Syllabus', 'Faculty', 'Rules', 'General', 'Events', 'Canteen'],
    default: 'General'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  corpus: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CollegeKnowledge', collegeKnowledgeSchema);
