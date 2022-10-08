const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      require: true,
      unique: true,
    },
    precio: Number,
    serie: String,
    personaje: String,
    escala: String,
    peso: String,
    material: String,
    stock: Number,
    oferta: String,
    img: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Products", ProductSchema);
