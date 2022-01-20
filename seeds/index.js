const mongoose = require("mongoose");
const cities = require("./cities");
const { places, descriptors } = require("./seedHelpers");
const Campground = require("../models/campground");

mongoose.connect("mongodb://localhost:27017/yelpcampdb", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

const sample = (array) => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
  await Campground.deleteMany({});
  for (let i = 0; i < 300; i++) {
    const random1000 = Math.floor(Math.random() * 1000);
    const price = Math.floor(Math.random() * 20) + 10;
    const camp = new Campground({
      //YOUR USER ID
      author: "61c5e266cc034382665937a7",
      location: `${cities[random1000].city}, ${cities[random1000].state}`,
      title: `${sample(descriptors)} ${sample(places)}`,
      description:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Asperiores dignissimos natus eligendi ipsum, ipsam corporis in repudiandae. Odio quibusdam numquam necessitatibus facere accusantium soluta, incidunt cumque quam suscipit, consequuntur quod?",
      price,
      geometry: {
        type: "Point",
        coordinates: [
          cities[random1000].longitude,
          cities[random1000].latitude,
        ],
      },
      images: [
        {
          url: "https://res.cloudinary.com/dxtrmcue8/image/upload/v1640437947/YelpCamp/bj0nqidtgen5bl63ym84.png",
          filename: "YelpCamp/bj0nqidtgen5bl63ym84",
        },
        {
          url: "https://res.cloudinary.com/dxtrmcue8/image/upload/v1640437947/YelpCamp/ibmtspjzol61lf1aom1q.png",
          filename: "YelpCamp/ibmtspjzol61lf1aom1q",
        },
      ],
    });
    await camp.save();
  }
};

seedDB().then(() => {
  mongoose.connection.close();
});
