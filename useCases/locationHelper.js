//@ts-check
const S2 = require("s2-geometry").S2;
const turf = require("@turf/turf");
const { waterfall, every } = require("async");
const { find, insert, remove } = require("../utility/dbUtils");
const { getNearestS2CellsAtLevel } = require("../utility/locationUtils");
// const { ObjectID }=require("mongodb");

function getLocationNameFromLatLong(latLng, finalCallback) {
    let s2CellId = S2.keyToId(S2.latLngToKey(...latLng, 15));
    waterfall([
        (callback) => {
            getS2CellData(s2CellId, callback);
        },
        (s2CellData, callback) => {
            if (!s2CellData.result) callback(null, null);
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
            if (!locationId) callback(null, null);
            else {
                find("location", { _id: locationId }, callback);
            }
        },
        (locationData, callback) => {
            if (!locationData || (locationData && !locationData.length)) callback(null, null);
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
    let concurrency = 100;
    every(s2CellIds, isS2CellNew, finalCallback);
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
function addNewLocation(locationName, geoJson, finalCallback, force=false) {

    function updateS2CellData(s2Cells, locationId, callback) {
        let s2CellData = s2Cells.map((s2CellId) => { return {locationId, s2CellId} });
        insert("s2CellData", s2CellData, callback);
    }

    let s2CellsInTheLocation = getNearestS2CellsAtLevel(geoJson);

    waterfall([
        (callback) => {
            checkForOverLapOfS2CellsWithExistingOnes(s2CellsInTheLocation, callback);
        },
        (areAllS2CellsNew, callback) => {
            if (!areAllS2CellsNew) {
                if (!force) callback(new Error("S2CELLIDS_HAVE_AN_OVERLAP"));
                else handleS2CellIdCollision(locationName, geoJson, finalCallback);
            }
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

function handleS2CellIdCollision(newLocationName, newGeoJson, finalCallback) {
    let oldLocationId,
        oldLocationName,
        oldGeoJson;
    waterfall([
        (callback) => {
            getCollisionLocation(newGeoJson, callback);
        },
        (collisionLocationData, callback) => {
            if (!collisionLocationData.length) callback("COLLISION_LOCATION_DATA_DOES_NOT_EXIST");
            let {
                _id: locationId,
                locationName,
                geoJsonId: oldGeoJsonId
            } = collisionLocationData[0];
            oldLocationId = locationId;
            oldLocationName = locationName;
            find("geoJsonData", { _id: oldGeoJsonId }, callback);
        },
        (geoJsonData, callback) => {
            if (!geoJsonData.length) callback("GEOJSON_DATA_DOESNT_EXIST");
            delete geoJsonData[0]["_id"];
            oldGeoJson = geoJsonData[0];
            deleteLocation(oldLocationId, callback);
        },
        (deletedData, callback) => {
            addNewLocation(newLocationName, newGeoJson, callback);
        },
        (newLocationData, callback) => {
            let intersection = turf.intersect(oldGeoJson, newGeoJson);
            let clippedOldGeoJson = turf.difference(oldGeoJson, intersection);
            addNewLocation(oldLocationName, clippedOldGeoJson, callback);
        }
    ], finalCallback);
}

function getCollisionLocation(geoJson, finalCallback) {
    let s2CellIds = getNearestS2CellsAtLevel(geoJson);
    if (!s2CellIds.length) finalCallback(new Error("IVALID_GEO_JSON"));
    waterfall([
        (callback) => {
            getS2CellIdOfCollidedCell(s2CellIds, callback);
        },
        (s2CellId, callback) => {
            find("s2CellData", { s2CellId }, callback);
        },
        (s2CellData, callback) => {
            if (!s2CellData.length) callback(new Error("S2_CELL_DATA_DOES_NOT_EXIST"));
            else {
                let {
                    locationId
                } = s2CellData[0];
                find("location", { _id: locationId }, callback);
            }
        }
    ], finalCallback);
}
function getS2CellIdOfCollidedCell(s2CellIds, finalCallback) {
    let s2CellData;
    function isS2CellNew(s2CellId, callback) {
        getS2CellData(s2CellId, (err, data) => {
            if (err) callback(err);
            else {
                if (data.result) {
                    s2CellData = data.result;
                    callback(null, false);
                }
                else callback(null, true);
            }
        });
    }
    let concurrency = 100;
    every(s2CellIds, isS2CellNew, (err, res) => {
        if (err || res) finalCallback(err || new Error("OVERLAP_DOES_NOT_EXIST"));
        else {
            if (!s2CellData) finalCallback(new Error("S2_DATA_DOES_NOT_EXIST"));
            else {
                finalCallback(null, s2CellData.s2CellId);
            }
        }
    });
}
function deleteLocation(locationId, finalCallback) {
    waterfall([
        (callback) => {
            remove("s2CellData", { locationId }, callback);
        },
        (deletedData, callback) => {
            find("location", {"_id": locationId}, callback);
        },
        (locationData, callback) => {
            if (!locationData.length) callback(new Error("LOCATION_DATA_DOES_NOT_EXIST"));
            else {
                let {
                    geoJsonId
                } = locationData[0];
                remove("geoJsonData", {"_id": geoJsonId}, callback);
            }
        },
        (deletedData, callback) => {
            remove("location", {"_id": locationId}, callback);
        }
    ], finalCallback);
}
// remove("s2CellData", {"_id": new ObjectID("5d08dece96c620b2c21adc0c")}, (err, res)=>{console.log(err||res)});
// :TEST
// const geoJson = require("../sample-geo.json");
// addNewLocation("sector 12 && 14 - v3", geoJson, sampleCallback);
// handleS2CellIdCollision("sector 14", geoJson, sampleCallback);
// function sampleCallback(err, res) {
    // console.log(err||res);
// }
module.exports = {
    getLocationNameFromLatLong,
    addNewLocation
};