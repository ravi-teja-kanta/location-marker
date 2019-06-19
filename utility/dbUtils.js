//@ts-check
const { MongoClient } = require("mongodb");
const password = "BkfVr8cON8pfZ3Xd";
const url = `mongodb+srv://ravi:${password}@cluster0-db10a.mongodb.net/test?retryWrites=true&w=majority`;

// var db;
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
        callback(null, client.db("trial"));
    });
}
function insert(name, data, callback) {
    getDb((err, db)=>{
        if (err) callback(err);
        else {
            db.collection(name).insert(data, (err, res) => {
                if (err) callback(err);
                else callback(null, res.ops && res.ops[0]);
            });
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

