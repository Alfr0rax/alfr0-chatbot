const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OfferSchema = new Schema({
  discound: Number,
  description: String,
});

module.exports = mongoose.model("Offers", OfferSchema);
