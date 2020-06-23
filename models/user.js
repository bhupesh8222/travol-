var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    username: String,
    password: String,
    email: String,
    imgId: String,
    /*post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: campsname
    }*/
    img: String
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);