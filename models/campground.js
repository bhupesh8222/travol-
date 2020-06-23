var mongoose = require("mongoose");
var campschema = new mongoose.Schema({
    name: String,
    img: String,
    description: String,
    imgId: String,
    /*location: String,
    lat: Number,
    lng: Number,*/
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User" //name of the collection
        },
        username: String
    },
    comment: [{
        type: mongoose.Schema.Types.ObjectId,
        //The refrence name is the collection name to where we are associating.
        ref: "comment"
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" //in usermodel we have written User , but in mongodb it is showing users as collection name
    }]
})


var campmodel = mongoose.model("campsname", campschema);

module.exports = campmodel;