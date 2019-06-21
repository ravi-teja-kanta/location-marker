//@ts-check
const express = require("express");
const router = express.Router();
const {  getLocationNameFromLatLong, addNewLocation } = require("./locationHelper");


router.post("/addNew", (req, res) => {
    let {
        locationName,
        geoJson,
        force
    } = req.body;
    addNewLocation(locationName, geoJson, (err, result) => {
        console.log(err||result);
        if (err) {
            res.send(err);
        } else {
            res.send({
                status: 200,
                result
            });
        }
    }, force);
});

router.post("/getLocationNameFromLatLng", (req, res) => {
    let {
        latLng
    } = req.body;
    getLocationNameFromLatLong(latLng, (err, result) => {
        console.log(err||result);
        if (err) {
            res.send(err);
        } else {
            res.status(200).send(JSON.stringify(result));
        }
    });
});


// updateS2CellData(["1224","hdhd"], "vizag");
module.exports = router;