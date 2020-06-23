//require('dotenv').config()
var express = require('express');
var request = require('request');
var bodyparser = require('body-parser');
var app = express();
var methodOverride = require("method-override");
app.use(methodOverride("_method"));
var mongoose = require("mongoose");
var campModel = require("./models/campground");
var commentModel = require('./models/comments.js')
var flash = require("connect-flash");


app.use(flash()); //flash() is function.

//AUTHENTICATION PART
var passport = require("passport");
var expressSession = require("express-session");
var passportLocal = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var userModel = require("./models/user.js");
//index



//MONGOOSE CONFIG
mongoose.connect("mongodb://localhost:27017/campp", {
    useUnifiedTopology: true,
    useNewUrlParser: true
});

mongoose.connection.once("open", function() {
    console.log("Connected to the database!!!");
});

mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);



//CONFIGURE PASSPORT
app.use(expressSession({
    secret: "This is the secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


//user.authenticate comes with passport-local-mongoose, here we are using local strategy for userModel
passport.use(new passportLocal(userModel.authenticate()));
passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());


//Method to delete the record 
/*campModel.deleteOne({ name: "Chandratal Lake, Himachal Pradesh" }, function() {
    console.log('Deleted!!');
});*/
//Saving to the database



/*campModel.create({
    name: "Camp Exotica, Kullu",
    img: "https://www.holidify.com/images/cmsuploads/compressed/tent-1208201_1920_20190212172038.jpg",
    description: "The Camp Exotica is a perfect weekend getaway option located in Kullu in the Manali district of Himachal Pradesh. The accommodation provided is world class and the tents simply leave you connecting with nature like never before. The location of these tents is such that it gives a panoramic view of the surrounding mountains. The food provided is of fine quality and the incredible view will simply leave you in awe of this adventure. Make sure to take out time for this pleasure full camping trip."
}, function(error, campgroundd) {
    if (error) {
        console.log("Error is there" + error);
    } //else {
    //console.log("Saved successfully" + campgroundd);
    //}
})*/

/*commentModel.create({
    text: "I love Ramayan!!",
    author: "Bhupesh X"
}, function(error, created) {
    campModel.findOne({ name: "Spiti Valley, Himachal Pradesh" }, function(error, found) {
        found.comment.push(created);
        found.save()
    })
})*/

/*var id = "5ea7b9f0bcd79f248019ecf7";
campModel.findById(id, function(error, camp) {
    camp.comment.pop();
    camp.save();
})*/



app.use(bodyparser.urlencoded({ extended: true }));
app.use('/css', express.static('css'));
//We are using the css folder for retrieving the css files

app.use('/partials', express.static('partials'));

//Whatever function is passed here will be called on every route, this is a middleware
app.use(function(req, res, next) {
    //res.locals.userName will be the variable to be passed.  //req.user contains the details of the user.
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
    //next function means to move in the next route.
})

//we have added currentuser in the response object.

app.set('view engine', 'ejs');


//ADDING ROUTES
var campsroutes = require(__dirname + "/routes/camproutes.js");
var commentroutes = require(__dirname + "/routes/commentroutes.js");
var authroutes = require(__dirname + "/routes/authroutes.js");


//We are specifying that the all camproutes must start with /camps & in camproutes file we can remove /camps from routes

//We are able to write shorter route declarartion
app.use("/camps", campsroutes);
app.use("/camps/:id/comments", commentroutes); //we will need to merge params.
app.use(authroutes);

const port = process.env.PORT || 3000;
app.listen(port, function() {
    console.log("SERVER HAS STARTED!!");
});