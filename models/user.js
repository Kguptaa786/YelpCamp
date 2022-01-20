const mongoose = require("mongoose");
const { Schema } = mongoose;
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
});

//this add username and password to UserSchema and take care of authentication
//whether username is unique or not
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
