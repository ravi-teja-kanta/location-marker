const express = require("express");
const router = express.Router();
const S2 = require("s2-geometry").S2;

const { waterfall } = require("async");
const { find } = require("./dbUtils");

// router.get("/getNameFromLatLng", (req, res)=>{
//     let {
//         point
//     } = req.body;
// });

// function getLocationNameFromLatLong(latLong, callback) {
//     let s2CellId = S2.keyToId(S2.latLngToKey(...latLng, 15));
//     find("s2CellData",{s2CellId}, (err, data)=>{
//         if (err) callback(err);
//         else {
//             console.log(data);
//             callback(null, data);
//         }
//     });
// }
// getLocationNameFromLatLong([])
module.exports = router;