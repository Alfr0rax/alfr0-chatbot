const express = require("express");
const router = express.Router();
const Product = require("../Models/Products");
const infoProduct = require("../Models/InfoProduct");
const offer = require("../Models/Offers");

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

router.post("/infoproducts", (req, res) => {
  let body = req.body;
  let productImg = new infoProduct({
    name: body.name,
    img: body.img,
  });
  productImg.save((err, productDB) => {
    if (err) return res.json({ ok: false, msg: "Hubo un Error" });

    res.json({
      ok: true,
      msg: "Producto Creado Correctamente",
      product: productDB,
    });
  });
});

router.post("/offers", (req, res) => {
  let body = req.body;
  let productImg = new offer({
    discound: body.discound,
    description: body.description,
  });
  productImg.save((err, offerDB) => {
    if (err) return res.json({ ok: false, msg: "Hubo un Error" });

    res.json({
      ok: true,
      msg: "Oferta Creada Correctamente",
      product: offerDB,
    });
  });
});

module.exports = router;
