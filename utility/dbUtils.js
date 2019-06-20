//@ts-check
const { MongoClient } = require("mongodb");
const password = "BkfVr8cON8pfZ3Xd";
const url = `mongodb://localhost:27017/`;
const mongoose = require("mongoose");
mongoose.connect(url);
// MongoClient.connect(url, (err, client) => {
//     if (err) {
//         console.log(err);
//     }
//     db = client.db("trial");
//     // db.collection("geoJsonData").insertOne({geoJsonData: {c:[0,1,"haha"]}}, (err, res)=>{
//     //     console.log(err||res);
//     //     client.close();
//     // });

// });
function getDb(callback) {
    MongoClient.connect(url, (err, client) => {
        if (err) {
            callback(err);
        }
        else callback(null, client.db("test"));
    });
}
function insert(name, data, callback) {
    getDb((err, db)=>{
        if (err) callback(err);
        else {
            if (!Array.isArray(data)) {
                data = [data];
            }
            if (!data.length) callback(new Error("Trying to Insert Somethig Empty"));
            else {
                db.collection(name).insertMany(data, (err, res) => {
                    if (err) callback(err);
                    else callback(null, res.ops && res.ops[0]);
                });
            }
        }
    });
}
function find(name, filter, callback) {
    getDb((err, db) => {
        if (err) callback(err);
        else {
            db.collection(name).find(filter, (err, cursor) => {
                if (err) callback(err);
                else {
                    cursor.toArray(function(err, res){
                        if (err) callback(err);
                        else {
                            callback(null, res);
                        }

                    });
                }
            });
        }
    });
}

function remove(name, query, callback) {
    getDb((err, db)=>{
        if (err) callback(err);
        else {
            db.collection(name).deleteMany(query, (err, res) => {
                if (err) callback(err);
                else callback(null, res);
            });
        }
    });
}

module.exports = {
    insert,
    find,
    remove
};

