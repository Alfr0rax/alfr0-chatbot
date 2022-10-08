const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OfferSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    facebookId: String,
    nameProduct: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Offers", OfferSchema);
