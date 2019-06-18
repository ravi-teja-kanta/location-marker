//@ts-check
const MongoClient = require("mongodb").MongoClient;
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

module.exports = {
    insert
};

