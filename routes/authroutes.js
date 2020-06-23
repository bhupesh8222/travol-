var express = require("express");
var router = express.Router();
var campModel = require("../models/campground");
var commentModel = require('../models/comments.js');
var userModel = require("../models/user.js");
var passport = require("passport");

//INDEX ROUTES
router.get('/', function(req, res) {
    console.log("Requested!!!")
    res.render('campground/home');
})

//AUTH ROUTES
router.get("/signup", (req, res) => {
    res.render("signup");
});

router.post("/signup", function(req, res) {
    var newUser = new userModel({ username: req.body.username, email: req.body.gmail, img: "data:image/png;base64,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" });
    userModel.register(newUser, req.body.password, function(error, user) {
        if (error) {
            //error contains the details of error while we having problem in signing up!
            req.flash("error", error.name + " : " + error.message);
            return res.redirect("/signup");
        }

        passport.authenticate("local")(req, res, function() {
            req.flash("success", "WELCOME,  " + user.username);
            res.redirect("/camps");
        })
    })
})

//==============
//LOGIN ROUTES

router.get("/login", function(req, res) {
    res.render('login');
});

router.post("/login", passport.authenticate("local", {
    successRedirect: "/camps",
    failureRedirect: "/login"
}), function(req, res) {

});


//LOGOUT ROUTE

router.get("/logout", function(req, res) {
    req.logout();
    //before redirecting we are sending the success message to camps!
    req.flash("success", "Logged you Out!!");
    res.redirect("/camps");
});



module.exports = router;