var express = require("express");
var router = express.Router({ mergeParams: true });

//in comment route :id is in index file and the remaining part of route is in this file, so to merge 
//route parameters it is passed.(if not not 'id' won't be identified by here router handler and req.params.id would be null)

var campModel = require("../models/campground");
var commentModel = require('../models/comments.js');
var passport = require("passport");

//NEW COMMENT ROUTE
router.get("/new", isloggedIn, function(req, res) {
    campModel.findById(req.params.id, function(error, camp) {
        if (error)
            console.log(error)
        else {
            res.render("comments/new", { camp: camp });
        }
    })
})

//MIDDLEWARE ISLOGedIN
function isloggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else
        req.flash("error", "You need to login first!");
    res.redirect("/login");
}



//CREATE COMMENT ROUTE
router.post("/", isloggedIn, function(req, res) {
    //FIND THE RELEVANT POST
    campModel.findById(req.params.id, function(error, campground) {
        if (error) {
            console.log(error)
        } else {
            if (req.body.newcomment.text == "" || req.body.newcomment.author == "") {
                return res.redirect('/camps/' + campground._id + "/comments/new");
            }
            //TAKE THE COMMENT FROM THE FORM UNDER THE NAME newcomment

            req.body.newcomment.date = Date.now();
            commentModel.create(req.body.newcomment, function(error, comment) {
                if (error) {
                    console.log(error)
                } else {
                    comment.author.id = req.user._id;
                    /*We will come here only when user is logged in, and when it is logged in and we are grabbing that user details
                    and putting that it in the comment*/
                    comment.author.username = req.user.username;
                    comment.save();
                    //ASSOCIATE THE COMMENT WITH THE POST
                    campground.comment.push(comment._id);
                    campground.save();
                    req.flash("success", "SUCCESSFULLY CREATED THE COMMENT");
                    res.redirect('/camps/' + campground._id);
                }
            })
        }
    })
})

//EDIT ROUTE
router.get("/:cid/edit", checkCommentOwnership, function(req, res) {
    commentModel.findById(req.params.cid, function(error, comment) {
        if (error) {
            console.log(error);
        } else {
            res.render("comments/edit", { comment: comment, camp: req.params.id });
        }
    })
})

//UPDATE ROUTE
router.put("/:cid", checkCommentOwnership, function(req, res) {
    commentModel.findById(req.params.cid, function(error, comment) {
        if (error) {
            console.log(error);
        } else {
            comment.text = req.body.newcomment;
            comment.save();
            req.flash("success", "SUCCESSFULLY UPDATED THE COMMENT");
            res.redirect("/camps/" + req.params.id);
        }
    })
})

//DELETE ROUTE
router.delete("/delete/:cid", checkCommentOwnership, function(req, res) {
    //firstly delete the element in the camp.comment array
    campModel.findById(req.params.id, function(error, camp) {
        if (error) {
            console.log(error);
        } else {
            for (var i = 0; i < camp.comment.length; i++) {
                //finding the corresponding comment id
                if (camp.comment[i] == req.params.cid) {
                    camp.comment.splice(i, 1); //remove the one element at ith pos
                    camp.save();
                }
            }
        }
    })

    //then we are removing the actual comment
    commentModel.findByIdAndRemove(req.params.cid, function(error) {
        if (error) {
            console.log(error);
        } else {
            req.flash("success", "DELETED THE COMMENT");
            res.redirect("/camps/" + req.params.id);
        }
    })
})

//MIDDLEWARE CHECKCOMMENTOWNERSHIP
function checkCommentOwnership(req, res, next) {
    //check if user logged in
    if (req.isAuthenticated()) {
        commentModel.findById(req.params.cid, function(error, comment) {
            if (error) {
                console.log(error);
            } else {
                //whether the comment creator is the logged in user!
                if (comment.author.id.equals(req.user._id)) { //buitin in method with mongoose
                    next();
                } else {
                    res.send("You don't have the permission to do that");
                }
            }
        })

    } else {
        res.redirect("back");
    }
}


module.exports = router;