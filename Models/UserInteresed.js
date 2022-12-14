const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserInteresedSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    facebookId: String,
    nameProduct: String,
    nameCharacter: String,
    serie: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserInteresed", UserInteresedSchema);
