//@ts-check
const express = require("express");
const app = express();
const PORT = 3000;
const bodyParser = require("body-parser");
const location = require("./useCases/location");

app.use("/location", location);
app.use(bodyParser.json());

app.get("/new", (req, res)=>{res.send({status: 200})});
app.listen(PORT, ()=>{console.log(`Server running on port:${PORT}`)});