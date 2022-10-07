const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    facebookId: {
      type: String,
      unique: true,
    },
    email: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Users", UserSchema);
