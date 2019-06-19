//@ts-check
const S2 = require("s2-geometry").S2;

const { waterfall, everyLimit } = require("async");
const { find, insert } = require("../utility/dbUtils");
const { getNearestS2CellsAtLevel } = require("../utility/locationUtils");


function getLocationNameFromLatLong(latLng, finalCallback) {
    let s2CellId = S2.keyToId(S2.latLngToKey(...latLng, 15));
    waterfall([
        (callback) => {
            getS2CellData(s2CellId, callback);
        },
        (s2CellData, callback) => {
            if (!s2CellData.result) callback(null);
            else {
                let {
                    result: {
                        locationId
                    }
                } = s2CellData;
                callback(null, locationId);
            }
        },
        (locationId, callback) => {
            if (!locationId) callback(null);
            else {
                find("location", { _id: locationId }, callback);
            }
        },
        (locationData, callback) => {
            if (!locationData.length) callback(null);
            else {
                let location = locationData[0];
                callback(null, {
                    status: "SUCCESS",
                    result: location.locationName
                });
            }
        }
    ], finalCallback);
}

function getS2CellData(s2CellId, finalCallback) {
    waterfall([
        (callback) => {
            find("s2CellData", { s2CellId }, callback);
        },
        (s2CellData, callback) => {
            if (!s2CellData.length) {
                callback(null, {
                    status: "DATA_DOES_NOT_EXIST"
                })
            } else {
                callback(null, {
                    status: "SUCCESS",
                    result: s2CellData[0]
                });
            }
        }
    ], finalCallback)
}
function checkForOverLapOfS2CellsWithExistingOnes(s2CellIds, finalCallback) {
    function isS2CellNew(s2CellId, callback) {
        getS2CellData(s2CellId, (err, data) => {
            if (err) callback(err);
            else {
                if (data.result) callback(null, false);
                else callback(null, true);
            }
        });
    }
    let concurrency = 10;
    everyLimit(s2CellIds, concurrency, isS2CellNew, finalCallback);
}
//: TEST
// let cellId = "5017247809041072128";
// let latLng = S2.idToLatLng(cellId);
// let {
//     lat,
//     lng
// } = latLng;
// getLocationNameFromLatLong([lat, lng], (err, data)=>{
//     console.log(err||data);
// });
// checkForOverLapOfS2CellsWithExistingOnes(["600", "700", "5017247809041072128"], (err, res)=>{
//     console.log(err||res);
// });
function addNewLocation(locationName, geoJson, finalCallback) {
    let s2CellsInTheLocation = getNearestS2CellsAtLevel(geoJson);

    waterfall([
        (callback) => {
            checkForOverLapOfS2CellsWithExistingOnes(s2CellsInTheLocation, callback);
        },
        (areAllS2CellsNew, callback) => {
            if (!areAllS2CellsNew) callback(new Error("S2CELLIDS_HAVE_AN_OVERLAP"));
            else {
                insert("geoJsonData", geoJson, callback);
            }
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
    let s2CellData = s2Cells.map((s2CellId) => { return {locationId, s2CellId} });
    insert("s2CellData", s2CellData, callback);
}
// :TEST
// const geoJson = require("../sample-geo.json");
// addNewLocation("sector 45", geoJson, (err, res) => {console.log(err||res)});
module.exports = {
    getLocationNameFromLatLong,
    addNewLocation
};