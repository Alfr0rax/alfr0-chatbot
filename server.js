const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require("mongoose");

const port = process.env.PORT || 3000;

// for parsing json b
app.use(
  bodyParser.json({
    limit: "20mb",
  })
);
// parse application/x-www-form-urlencoded
app.use(
  bodyParser.urlencoded({
    extended: false,
    limit: "20mb",
  })
);

mongoose.connect(
  "mongodb+srv://alfr0rax:alfr0-chatbot@dialogflowcluster.itl1srr.mongodb.net/chatbotDB?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  },
  (err, res) => {
    if (err) return console.log("Hubo un Error en la Base de Datos ", err);
    console.log("BASE DE DATOS ONLINE");
  }
);

app.use("/messenger", require("./Controllers/facebookController"));

app.get("/", (req, res) => {
  return res.send("Chatbot Funcionando 🤖🤖🤖");
});

app.listen(port, () => {
  console.log(`Escuchando peticiones en el puerto ${port}`);
});
