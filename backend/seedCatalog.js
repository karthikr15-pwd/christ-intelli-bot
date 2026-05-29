const mongoose = require('mongoose');
require('dotenv').config();

const Canteen = require('./src/models/Canteen');
const MenuItem = require('./src/models/MenuItem');

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/christ-intelli-bot');
    
    console.log('Clearing existing catalog data...');
    try {
      await mongoose.connection.collections['canteens'].drop();
    } catch(e) {}
    try {
      await mongoose.connection.collections['menuitems'].drop();
    } catch(e) {}

    console.log('Seeding Canteens...');
    const canteens = await Canteen.insertMany([
      {
        name: "MBA Canteen",
        coverImageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
        operatingHours: "9:00 AM - 6:00 PM"
      },
      {
        name: "KN'S",
        coverImageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80",
        operatingHours: "8:00 AM - 8:00 PM"
      },
      {
        name: "South Canteen",
        coverImageUrl: "https://images.unsplash.com/photo-1505826759037-406b40feb4cd?w=800&q=80",
        operatingHours: "9:00 AM - 5:00 PM"
      },
      {
        name: "North Canteen",
        coverImageUrl: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800&q=80",
        operatingHours: "10:00 AM - 7:00 PM"
      }
    ]);

    const getCanteenId = (name) => canteens.find(c => c.name === name)._id;

    console.log('Seeding Menu Items...');
    const menuItems = [
      // MBA Canteen Items
      {
        canteenId: getCanteenId("MBA Canteen"),
        name: "Veg Meals",
        description: "Full South Indian meals with rice, sambar, rasam, and 2 curries",
        price: 70,
        category: "Meals",
        isVeg: true
      },
      {
        canteenId: getCanteenId("MBA Canteen"),
        name: "Chicken Biryani",
        description: "Spicy and flavorful chicken biryani with raita",
        price: 120,
        category: "Meals",
        isVeg: false
      },
      {
        canteenId: getCanteenId("MBA Canteen"),
        name: "Cold Coffee",
        description: "Thick, blended cold coffee with chocolate syrup",
        price: 50,
        category: "Beverages",
        isVeg: true
      },
      {
        canteenId: getCanteenId("MBA Canteen"),
        name: "Masala Dosa",
        description: "Crispy dosa filled with spicy potato mash, served with chutney",
        price: 55,
        category: "Snacks",
        isVeg: true
      },
      {
        canteenId: getCanteenId("MBA Canteen"),
        name: "Paneer Butter Masala",
        description: "Rich and creamy paneer curry",
        price: 100,
        category: "Meals",
        isVeg: true
      },
      {
        canteenId: getCanteenId("MBA Canteen"),
        name: "Butter Naan",
        description: "Soft and buttery flatbread",
        price: 30,
        category: "Meals",
        isVeg: true
      },
      {
        canteenId: getCanteenId("MBA Canteen"),
        name: "Mango Lassi",
        description: "Refreshing mango flavored yogurt drink",
        price: 45,
        category: "Beverages",
        isVeg: true
      },
      {
        canteenId: getCanteenId("MBA Canteen"),
        name: "French Fries",
        description: "Crispy golden french fries",
        price: 60,
        category: "Snacks",
        isVeg: true
      },
      {
        canteenId: getCanteenId("MBA Canteen"),
        name: "Gulab Jamun",
        description: "Soft milk solids balls soaked in sugar syrup",
        price: 40,
        category: "Desserts",
        isVeg: true
      },

      // KN'S Items
      {
        canteenId: getCanteenId("KN'S"),
        name: "Cheese Grilled Sandwich",
        description: "Triple layered cheese and veggie grilled sandwich",
        price: 60,
        category: "Snacks",
        isVeg: true
      },
      {
        canteenId: getCanteenId("KN'S"),
        name: "Oreo Shake",
        description: "Creamy milkshake blended with crushed Oreos",
        price: 75,
        category: "Beverages",
        isVeg: true
      },
      {
        canteenId: getCanteenId("KN'S"),
        name: "Chicken Nuggets",
        description: "Crispy fried chicken nuggets (6 pieces)",
        price: 80,
        category: "Snacks",
        isVeg: false
      },
      {
        canteenId: getCanteenId("KN'S"),
        name: "Chocolate Brownie",
        description: "Warm chocolate brownie topped with vanilla ice cream",
        price: 90,
        category: "Desserts",
        isVeg: true
      },
      {
        canteenId: getCanteenId("KN'S"),
        name: "Veg Burger",
        description: "Classic veggie patty burger with cheese",
        price: 70,
        category: "Snacks",
        isVeg: true
      },
      {
        canteenId: getCanteenId("KN'S"),
        name: "Chicken Burger",
        description: "Crispy chicken patty burger with mayo",
        price: 90,
        category: "Snacks",
        isVeg: false
      },
      {
        canteenId: getCanteenId("KN'S"),
        name: "KitKat Shake",
        description: "Thick shake blended with KitKat chunks",
        price: 85,
        category: "Beverages",
        isVeg: true
      },
      {
        canteenId: getCanteenId("KN'S"),
        name: "Peri Peri Fries",
        description: "French fries tossed in spicy peri peri seasoning",
        price: 70,
        category: "Snacks",
        isVeg: true
      },
      {
        canteenId: getCanteenId("KN'S"),
        name: "Red Velvet Cake",
        description: "Slice of rich red velvet cake with cream cheese frosting",
        price: 110,
        category: "Desserts",
        isVeg: true
      },

      // South Canteen Items
      {
        canteenId: getCanteenId("South Canteen"),
        name: "Idli Vada",
        description: "2 soft idlis and 1 crispy vada with sambar and chutney",
        price: 40,
        category: "Snacks",
        isVeg: true
      },
      {
        canteenId: getCanteenId("South Canteen"),
        name: "Pongal",
        description: "Hot ghee pongal served with sambar",
        price: 45,
        category: "Meals",
        isVeg: true
      },
      {
        canteenId: getCanteenId("South Canteen"),
        name: "Filter Coffee",
        description: "Authentic South Indian filter coffee",
        price: 20,
        category: "Beverages",
        isVeg: true
      },
      {
        canteenId: getCanteenId("South Canteen"),
        name: "Egg Puff",
        description: "Flaky pastry filled with spicy egg masala",
        price: 25,
        category: "Snacks",
        isVeg: false
      },
      {
        canteenId: getCanteenId("South Canteen"),
        name: "Bisi Bele Bath",
        description: "Spicy rice and lentil dish with vegetables",
        price: 55,
        category: "Meals",
        isVeg: true
      },
      {
        canteenId: getCanteenId("South Canteen"),
        name: "Medu Vada (2 pcs)",
        description: "Crispy lentil donuts served with chutney",
        price: 35,
        category: "Snacks",
        isVeg: true
      },
      {
        canteenId: getCanteenId("South Canteen"),
        name: "Tea",
        description: "Hot masala chai",
        price: 15,
        category: "Beverages",
        isVeg: true
      },
      {
        canteenId: getCanteenId("South Canteen"),
        name: "Veg Puff",
        description: "Flaky pastry filled with spiced mixed vegetables",
        price: 20,
        category: "Snacks",
        isVeg: true
      },
      {
        canteenId: getCanteenId("South Canteen"),
        name: "Kesari Bath",
        description: "Sweet semolina dessert with cashews",
        price: 35,
        category: "Desserts",
        isVeg: true
      },

      // North Canteen Items
      {
        canteenId: getCanteenId("North Canteen"),
        name: "Chole Bhature",
        description: "2 fluffy bhatures with spicy chole masala",
        price: 80,
        category: "Meals",
        isVeg: true
      },
      {
        canteenId: getCanteenId("North Canteen"),
        name: "Paneer Tikka Roll",
        description: "Spicy paneer tikka wrapped in a soft paratha",
        price: 70,
        category: "Snacks",
        isVeg: true
      },
      {
        canteenId: getCanteenId("North Canteen"),
        name: "Chicken Roll",
        description: "Juicy chicken kebab wrapped in a soft paratha",
        price: 80,
        category: "Snacks",
        isVeg: false
      },
      {
        canteenId: getCanteenId("North Canteen"),
        name: "Sweet Lassi",
        description: "Thick, sweetened yogurt drink",
        price: 35,
        category: "Beverages",
        isVeg: true
      },
      {
        canteenId: getCanteenId("North Canteen"),
        name: "Rajma Chawal",
        description: "Kidney bean curry served over steamed rice",
        price: 75,
        category: "Meals",
        isVeg: true
      },
      {
        canteenId: getCanteenId("North Canteen"),
        name: "Aloo Paratha",
        description: "2 stuffed potato parathas with curd and pickle",
        price: 65,
        category: "Meals",
        isVeg: true
      },
      {
        canteenId: getCanteenId("North Canteen"),
        name: "Samosa (2 pcs)",
        description: "Crispy pastry filled with spiced potatoes and peas",
        price: 30,
        category: "Snacks",
        isVeg: true
      },
      {
        canteenId: getCanteenId("North Canteen"),
        name: "Jalebi",
        description: "Crispy spiral sweets soaked in sugar syrup",
        price: 40,
        category: "Desserts",
        isVeg: true
      },
      {
        canteenId: getCanteenId("North Canteen"),
        name: "Nimbu Pani",
        description: "Refreshing fresh lime water",
        price: 25,
        category: "Beverages",
        isVeg: true
      }
    ];

    await MenuItem.insertMany(menuItems);
    
    console.log('Successfully seeded database with Canteens and Menu Items!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

seedData();
