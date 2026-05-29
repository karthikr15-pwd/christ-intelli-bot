const mongoose = require('mongoose');

const knowledgeBaseSchema = new mongoose.Schema({
  questionPattern: {
    type: String,
    required: true,
    trim: true
  },
  answerText: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('KnowledgeBase', knowledgeBaseSchema);
