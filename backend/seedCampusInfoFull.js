require('dotenv').config();
const mongoose = require('mongoose');
const CampusInformation = require('./src/models/CampusInformation');

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(10, 0, 0, 0);

const nextMonth = new Date();
nextMonth.setDate(nextMonth.getDate() + 30);
nextMonth.setHours(0, 0, 0, 0);

const pastDate = new Date();
pastDate.setDate(pastDate.getDate() - 5);

const nextWeek = new Date();
nextWeek.setDate(nextWeek.getDate() + 7);

const mockData = [
  // ACADEMICS
  {
    category: 'ACADEMICS',
    subCategory: 'Syllabus',
    title: 'BTech Computer Science Semester 6',
    contentDetails: 'Subjects include: Artificial Intelligence, Compiler Design, Machine Learning, and Web Technologies. End semester exams begin on May 30th.'
  },
  {
    category: 'ACADEMICS',
    subCategory: 'Library',
    title: 'Central Library Hours',
    contentDetails: 'The Central Library is open from 8:00 AM to 9:00 PM on weekdays, and 9:00 AM to 4:00 PM on weekends. Students must carry their ID cards.'
  },
  {
    category: 'ACADEMICS',
    subCategory: 'Placements',
    title: 'Campus Placement Eligibility 2026',
    contentDetails: 'Students must maintain a minimum CGPA of 7.5 to be eligible for Tier-1 company placements. Mandatory aptitude tests will be conducted every Friday.'
  },
  {
    category: 'ACADEMICS',
    subCategory: 'Exams',
    title: 'CIA 3 Guidelines',
    contentDetails: 'Continuous Internal Assessment 3 requires a physical project submission. Plagiarism over 15% will result in a direct zero.'
  },
  {
    category: 'ACADEMICS',
    subCategory: 'Fees',
    title: 'Semester Fee Payment Schedule',
    contentDetails: 'The portal for odd semester fee payment opens on June 15th. Late fees of ₹500/day apply after July 1st. Payment only accepted via Knowledge Pro.'
  },

  // EVENTS_ANNOUNCEMENTS
  {
    category: 'EVENTS_ANNOUNCEMENTS',
    subCategory: 'Hackathon',
    title: 'CodeRed Hackathon 2026',
    contentDetails: 'Join the annual 24-hour coding marathon! Free food, cash prizes, and networking with top tech companies. Location: Main Auditorium.',
    expiryDate: tomorrow
  },
  {
    category: 'EVENTS_ANNOUNCEMENTS',
    subCategory: 'Holiday',
    title: 'Mid-Semester Break',
    contentDetails: 'The campus will be closed for the mid-semester break starting next week. Hostels will remain open for international students.',
    expiryDate: nextMonth
  },
  {
    category: 'EVENTS_ANNOUNCEMENTS',
    subCategory: 'Cultural',
    title: 'Bhasha Utsav 2026',
    contentDetails: 'Celebrate the ethnic diversity of our campus! Ethnic wear is mandatory for all students and faculty. Food stalls will be set up in the central quadrangle.',
    expiryDate: nextWeek
  },
  {
    category: 'EVENTS_ANNOUNCEMENTS',
    subCategory: 'Seminar',
    title: 'AI in Healthcare Guest Lecture',
    contentDetails: 'Guest lecture by Dr. Alan Turing on Generative AI applications in Healthcare. Mandatory for all 3rd-year CS students. Block B, Room 401.',
    expiryDate: tomorrow
  },
  {
    category: 'EVENTS_ANNOUNCEMENTS',
    subCategory: 'Expired Event',
    title: 'Freshers Orientation',
    contentDetails: 'Welcome to the campus! Orientation begins at 9 AM in the main auditorium.',
    expiryDate: pastDate // Should be filtered out by the backend!
  },

  // INFRASTRUCTURE
  {
    category: 'INFRASTRUCTURE',
    subCategory: 'Hostels',
    title: 'Campus Hostel Rules',
    contentDetails: 'Curfew is strictly at 9:30 PM. No outside food is allowed after 10:00 PM. Visitors are only allowed in the reception area during visiting hours (4 PM - 6 PM).'
  },
  {
    category: 'INFRASTRUCTURE',
    subCategory: 'Sports',
    title: 'Sports Complex Booking',
    contentDetails: 'Badminton and Tennis courts must be booked 24 hours in advance through the student portal. Maximum booking duration is 1.5 hours per student.'
  },
  {
    category: 'INFRASTRUCTURE',
    subCategory: 'Gymnasium',
    title: 'Gym Timings & Membership',
    contentDetails: 'The campus gym is open from 5:30 AM to 8:30 AM, and 4:30 PM to 8:30 PM. Monthly membership is ₹500, payable at the finance office.'
  },
  {
    category: 'INFRASTRUCTURE',
    subCategory: 'Parking',
    title: 'Student Vehicle Parking',
    contentDetails: 'Students must display a valid parking sticker on their vehicles. Two-wheeler parking is near Gate 2. Four-wheelers are not permitted for students inside campus.'
  },
  {
    category: 'INFRASTRUCTURE',
    subCategory: 'Laboratories',
    title: 'IoT & Robotics Lab Access',
    contentDetails: 'The IoT lab in Block C is open until 7:00 PM. Students must log their entry and exit in the register. Equipment cannot be taken outside the lab without HOD approval.'
  },

  // IT_SUPPORT
  {
    category: 'IT_SUPPORT',
    subCategory: 'Wi-Fi',
    title: 'Connecting to Campus Wi-Fi',
    contentDetails: 'Select "Christ_Student" network. Enter your registration number as the username and your portal password. For MAC address whitelisting, visit the IT desk in Block A.'
  },
  {
    category: 'IT_SUPPORT',
    subCategory: 'Portal',
    title: 'Knowledge Pro Password Reset',
    contentDetails: 'If you forgot your KP password, click on "Forgot Password" on the login page. An OTP will be sent to your registered mobile number and email ID.'
  },
  {
    category: 'IT_SUPPORT',
    subCategory: 'Software',
    title: 'Free Microsoft Office 365',
    contentDetails: 'All students get free access to Office 365. Log in to office.com using your official @christuniversity.in email address.'
  },
  {
    category: 'IT_SUPPORT',
    subCategory: 'Hardware',
    title: 'Laptop Repair Helpdesk',
    contentDetails: 'The IT Helpdesk provides free basic diagnostics for student laptops on Tuesdays and Thursdays between 2 PM and 4 PM in Block A, Ground Floor.'
  },
  {
    category: 'IT_SUPPORT',
    subCategory: 'Printers',
    title: 'Campus Cloud Printing',
    contentDetails: 'Upload your documents to print.christ.edu and scan your ID card at any campus printer kiosk to release your print jobs. Cost is ₹2 per page.'
  },

  // EMERGENCY
  {
    category: 'EMERGENCY',
    subCategory: 'Medical',
    title: 'Campus Health Center',
    contentDetails: 'The health center is located behind the main cafeteria. It is open 24/7 for emergencies. Ambulance contact: +91 99999 88888.'
  },
  {
    category: 'EMERGENCY',
    subCategory: 'Security',
    title: 'Campus Security Helpline',
    contentDetails: 'For any immediate security concerns or lost and found, contact the Main Gate Security Desk at +91 99999 77777 or dial 100 from any campus intercom.'
  },
  {
    category: 'EMERGENCY',
    subCategory: 'Fire',
    title: 'Fire Evacuation Protocol',
    contentDetails: 'In case of fire alarms, use the stairs (do not use elevators) and assemble at the primary assembly point on the main football ground.'
  },
  {
    category: 'EMERGENCY',
    subCategory: 'Anti-Ragging',
    title: 'Anti-Ragging Squad Contact',
    contentDetails: 'Ragging is strictly prohibited. If you face or witness any issues, immediately contact the Anti-Ragging toll-free number 1800-180-5522 or email the nodal officer.'
  },
  {
    category: 'EMERGENCY',
    subCategory: 'Counseling',
    title: 'Student Wellbeing Center',
    contentDetails: 'Mental health emergencies are treated with utmost priority. The counseling center is located in Block B, Floor 1. Walk-ins are accepted during crisis situations.'
  }
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected. Clearing old campus info...');
    await CampusInformation.deleteMany({});
    
    console.log(`Seeding ${mockData.length} new CampusInformation records...`);
    await CampusInformation.insertMany(mockData);
    
    console.log('CampusInformation seeded successfully with expanded data!');
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
