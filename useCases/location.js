//@ts-check
const express = require("express");
const router = express.Router();
const { getNearestS2CellsAtLevel } = require("./locationUtils");
const { waterfall } = require("async");
const {insert} = require("./dbUtils");
// const geoJson = require("../sample-geo.json");
router.post("/addNew", (req, res) => {
    let {
        locationName,
        geoJson
    } = req.body;
    addNewLocation(locationName, geoJson, (err, result)=> {
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

function addNewLocation(locationName, geoJson, finalCallback) {
    let s2CellsInTheLocation = getNearestS2CellsAtLevel(geoJson);

    waterfall([
        (callback) => {
            insert("geoJsonData", geoJson, callback);
        },
        (geoJson, callback) => {
            let {
                _id: geoJsonId
            } = geoJson;
            insert("location", {locationName, geoJsonId}, callback);
        },
        (locationData, callback) => {
            let {
                _id: locationId
            } = locationData;
            updateS2CellData(s2CellsInTheLocation, locationId, callback);
        }
    ], finalCallback);
}
function updateS2CellData(s2Cells, locationId, callback) {
    let s2CellData = s2Cells.map((s2CellId)=>{ return {locationId, s2CellId} });
    insert("s2CellData", s2CellData, callback);
}
// addNewLocation("sector 45", geoJson, (err, res) => {console.log(err||res)});
// updateS2CellData(["1224","hdhd"], "vizag");
module.exports = router;