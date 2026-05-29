const mongoose = require('mongoose');
require('dotenv').config();
const Place = require('./src/models/Place');
const Route = require('./src/models/Route');
const Checkpoint = require('./src/models/Checkpoint');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const places = await Place.find();
  console.log('PLACES:', places);
  const routes = await Route.find();
  console.log('ROUTES:', routes);
  const checkpoints = await Checkpoint.find();
  console.log('CHECKPOINTS:', checkpoints);
  process.exit(0);
});
