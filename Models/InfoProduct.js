const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const InfoProductSchema = new Schema({
  name: {
    type: String,
    require: true,
    unique: true,
  },
  img: Array,
});

module.exports = mongoose.model("InfoProduct", InfoProductSchema);
