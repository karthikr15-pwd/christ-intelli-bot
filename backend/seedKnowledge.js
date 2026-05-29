require('dotenv').config();
const mongoose = require('mongoose');
const Knowledge = require('./src/models/Knowledge');

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(10, 0, 0, 0);

const dayAfter = new Date();
dayAfter.setDate(dayAfter.getDate() + 2);
dayAfter.setHours(0, 0, 0, 0);

const mockData = [
  {
    itemType: 'Course',
    courseCode: 'CSC501',
    title: 'Artificial Intelligence',
    corpus: 'This course covers the fundamentals of AI, including search algorithms, machine learning, neural networks, and natural language processing. Prerequisites: Data Structures and Algorithms.'
  },
  {
    itemType: 'Course',
    courseCode: 'ENG101',
    title: 'Professional Communication',
    corpus: 'A foundational course designed to improve written and verbal communication skills in a professional corporate environment. Focuses on email etiquette, presentations, and report writing.'
  },
  {
    itemType: 'Event',
    title: 'Christ Fest 2026',
    corpus: 'The annual cultural festival of Christ University. Join us for a day of music, dance, and food stalls. Located at the Main Auditorium.',
    eventDate: tomorrow
  },
  {
    itemType: 'Holiday',
    title: 'Semester Break Start',
    corpus: 'The university will be closed for the beginning of the semester break. No classes will be held.',
    eventDate: dayAfter
  },
  {
    itemType: 'Announcement',
    title: 'Library Extended Hours',
    corpus: 'Due to the upcoming final examinations, the central library will remain open until midnight starting next week.'
  },
  {
    itemType: 'Announcement',
    title: 'Campus Wi-Fi Maintenance',
    corpus: 'The campus Wi-Fi network will undergo scheduled maintenance this Sunday from 2 AM to 4 AM. Expect intermittent connectivity issues.'
  },
  {
    itemType: 'General',
    title: 'Hostel Curfew Rules',
    corpus: 'All students residing in the campus hostels must return to their respective blocks by 9:30 PM. Late entries require prior permission from the warden.'
  }
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected. Clearing old knowledge...');
    await Knowledge.deleteMany({});
    
    console.log('Seeding new time-aware knowledge...');
    await Knowledge.insertMany(mockData);
    
    console.log('Knowledge Base seeded successfully!');
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
