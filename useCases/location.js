//@ts-check
const express = require("express");
const router = express.Router();
const {  getLocationNameFromLatLong, addNewLocation } = require("./locationHelper");


router.post("/addNew", (req, res) => {
    let {
        locationName,
        geoJson
    } = req.body;
    addNewLocation(locationName, geoJson, (err, result) => {
        if (err) {
            res.send(err);
        } else {
            res.send({
                status: 200,
                result
            });
        }
    });
});

router.post("/getLocationNameFromLatLng", (req, res) => {
    let {
        latlng
    } = req.body;
    getLocationNameFromLatLong(latlng, (err, result) => {
        if (err) {
            res.send(err);
        } else {
            res.send({
                status: 200,
                result
            });
        }
    });
});


// updateS2CellData(["1224","hdhd"], "vizag");
module.exports = router;