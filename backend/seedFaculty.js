const mongoose = require('mongoose');
require('dotenv').config();

const Faculty = require('./src/models/Faculty');

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

const mockFaculty = [
  { fullName: "Dr. Alice Smith", department: "Computer Science", blockName: "Block 1", floorLevel: "Ground Floor", cabinNumber: "101", staffroomNumber: "", timings: "Mon-Fri, 9 AM - 4 PM" },
  { fullName: "Prof. Bob Johnson", department: "Mechanical Engineering", blockName: "Block 2", floorLevel: "1st Floor", cabinNumber: "215", staffroomNumber: "", timings: "Tue-Thu, 10 AM - 2 PM" },
  { fullName: "Dr. Charlie Brown", department: "Electronics", blockName: "Block 3", floorLevel: "2nd Floor", cabinNumber: "", staffroomNumber: "Staffroom A", timings: "Mon-Wed, 11 AM - 3 PM" },
  { fullName: "Dr. Diana Prince", department: "Civil Engineering", blockName: "Block 4", floorLevel: "3rd Floor", cabinNumber: "405", staffroomNumber: "", timings: "Mon-Fri, 9 AM - 1 PM" },
  { fullName: "Prof. Ethan Hunt", department: "Aerospace", blockName: "Block 5", floorLevel: "1st Floor", cabinNumber: "120", staffroomNumber: "", timings: "Wed-Fri, 1 PM - 5 PM" },
  { fullName: "Dr. Fiona Gallagher", department: "Architecture", blockName: "Architecture Block", floorLevel: "2nd Floor", cabinNumber: "250", staffroomNumber: "", timings: "Mon-Fri, 10 AM - 4 PM" },
  { fullName: "Dr. George Harrison", department: "Computer Science", blockName: "Block 1", floorLevel: "Ground Floor", cabinNumber: "102", staffroomNumber: "", timings: "Mon-Thu, 8 AM - 12 PM" },
  { fullName: "Prof. Harry Potter", department: "Mathematics", blockName: "Block 6", floorLevel: "4th Floor", cabinNumber: "", staffroomNumber: "Staffroom B", timings: "Tue-Fri, 9 AM - 2 PM" },
  { fullName: "Dr. Iris West", department: "Physics", blockName: "Block 3", floorLevel: "1st Floor", cabinNumber: "210", staffroomNumber: "", timings: "Mon-Wed, 2 PM - 6 PM" },
  { fullName: "Dr. Jack Sparrow", department: "Management", blockName: "Devadan Hall", floorLevel: "3rd Floor", cabinNumber: "305", staffroomNumber: "", timings: "Thu-Fri, 10 AM - 5 PM" },
  { fullName: "Prof. Kelly Kapoor", department: "Computer Science", blockName: "Block 1", floorLevel: "1st Floor", cabinNumber: "115", staffroomNumber: "", timings: "Mon-Fri, 9 AM - 3 PM" },
  { fullName: "Dr. Luke Skywalker", department: "Electronics", blockName: "Block 2", floorLevel: "Ground Floor", cabinNumber: "", staffroomNumber: "Staffroom C", timings: "Mon-Tue, 1 PM - 4 PM" },
  { fullName: "Dr. Mary Jane", department: "Civil Engineering", blockName: "Block 4", floorLevel: "2nd Floor", cabinNumber: "220", staffroomNumber: "", timings: "Wed-Fri, 9 AM - 1 PM" },
  { fullName: "Prof. Ned Stark", department: "Mechanical Engineering", blockName: "Block 5", floorLevel: "3rd Floor", cabinNumber: "330", staffroomNumber: "", timings: "Mon-Thu, 10 AM - 3 PM" },
  { fullName: "Dr. Olivia Pope", department: "Architecture", blockName: "Architecture Block", floorLevel: "1st Floor", cabinNumber: "150", staffroomNumber: "", timings: "Tue-Fri, 11 AM - 5 PM" }
];

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/christ-intelli-bot');
    console.log('Connected to DB');

    // Prepare data by injecting coordinates
    const formattedData = mockFaculty.map(fac => {
        const coords = coordinateDictionary[fac.blockName];
        return {
            ...fac,
            latitude: coords ? coords.lat : 0,
            longitude: coords ? coords.lng : 0
        };
    });

    console.log('Clearing existing faculty...');
    await Faculty.deleteMany({});
    
    console.log('Inserting 15 mock faculty members...');
    await Faculty.insertMany(formattedData);
    
    console.log('Mock Data Inserted Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
