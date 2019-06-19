//@ts-check
const turf = require("@turf/turf");
const S2 = require("s2-geometry").S2;

function getNeighboursAtLevel(point, level) {
    let keys = S2.latLngToNeighborKeys(...point, level);
    let ltlngs = keys.map((key)=>S2.keyToLatLng(key));
    return turf.points(ltlngs.map(c=>[c.lat, c.lng]));
}
function turfPointToLatLng(turfPoint) {
    let {
        geometry: {
            coordinates
        }
    } = turfPoint;
    return coordinates;
}

function getNearestS2CellsAtLevel(geoJson, level=15) {
    let geoPoints = geoJson.geometry.coordinates[0];
    let startingPoint = geoPoints[0];
    if (!startingPoint) return [];

    let pointsToBeSearched = [startingPoint];
    let memo = {}, cells = {};
    let bBox = turf.envelope(geoJson);

    while (pointsToBeSearched.length) {
        let point = pointsToBeSearched.pop();
        let allNeighbours = getNeighboursAtLevel(point, level);
        
        let neighboursWithinBBox = turf.pointsWithinPolygon(allNeighbours, bBox);
        let neighboursWithinGeoJson = turf.pointsWithinPolygon(allNeighbours, geoJson);
        
        let pointsWithinBBox = neighboursWithinBBox.features.map(turfPointToLatLng);
        let pointsWithinGeoJson = neighboursWithinGeoJson.features.map(turfPointToLatLng);

        pointsWithinBBox.forEach(p => {
            if (!memo[p]) {
                pointsToBeSearched.push(p);
                memo[p] = true;
            }
        });
        pointsWithinGeoJson.forEach(p => {
            if (!cells[p]) {
                cells[p] = true;
            }
        });
    }
    let s2CellIds =  
        Object.keys(cells)
        .map(latLng => {
            let [lat, lng] = latLng.split(",");
            return S2.latLngToKey(lat, lng, level);
        })
        .map(S2.keyToId);

    return s2CellIds;
}

module.exports = {
    getNearestS2CellsAtLevel
};
// :TEST
// let geoJson = require("./sample-geo.json");
// let start = Date.now();
// console.log(getNearestS2CellsAtLevel(geoJson, level));
// console.log("Time elapsed: ",(Date.now() - start)/1000, "seconds");


