const express = require("express");
const router = express.Router();
const Product = require("../Models/Products");

router.get("/chatbot", (req, res) => {
  res.json({ ok: true, msg: "Esto esta Funcionando bien" });
});

router.post("/products", (req, res) => {
  let body = req.body;
  let product = new Product({
    name: body.name,
    precio: body.precio,
    serie: body.serie,
    personaje: body.personaje,
    escala: body.escala,
    peso: body.peso,
    material: body.material,
    stock: body.stock,
    img: body.img,
  });
  product.save((err, productDB) => {
    if (err) return res.json({ ok: false, msg: "Hubo un Error" });

    res.json({
      ok: true,
      msg: "Producto Creado Correctamente",
      product: productDB,
    });
  });
});
module.exports = router;
