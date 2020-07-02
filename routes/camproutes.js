require('dotenv').config()
var express = require("express");
var multer = require("multer");
var router = express.Router();
var campModel = require("../models/campground.js");
var commentModel = require('../models/comments.js');
var userModel = require("../models/user.js");
var path = require("path");
var cloudinary = require("cloudinary").v2;
var fs = require('fs');

//CLOUDINARY CONFIG
cloudinary.config({
    cloud_name: "dsbphnylj",
    api_key: process.env.CLOUDINARY_API_KEY, //.env file must be in the root of cwd
    api_secret: process.env.CLOUDINARY_API_SECRET
})


/*var NodeGeocoder = require('node-geocoder');

var options = {
    provider: 'google',
    httpAdapter: 'https',
    apiKey: process.env.GEOCODER_API_KEY,
    formatter: null
};

var geocoder = NodeGeocoder(options);*/


//MULTER CONFIG

//destination is used to determine within which folder the uploaded files should be stored
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'upload');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + file.originalname);
    }
})

var upload = multer({
    storage: storage,
    fileFilter: function(req, file, callback) {
        //Checking whether the extension name is jpeg/jpg/
        var ext = path.extname(file.originalname);
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg' && ext !== '.PNG' && ext !== '.JPG' && ext !== '.GIF' && ext !== '.JPEG') {
            return callback(new Error('Only images are allowed'))
        }
        callback(null, true);
    },
});

router.get('/', function(req, res) {
    //res.render("camps", { camps: campModel.find({}) });
    //console.log(req.user);
    campModel.find({}, function(error, result) {
        if (error) {
            req.flash("error", error.message);
            res.redirect("back");
        } else {
            //console.log(result)
            res.render("campground/allcamps", { camps: result });
        }
    })
})

//someone can still send post route by postman, so there's 'isloggedIn' middleware needed here! 

//upload is getting from multer
router.post('/', isloggedIn, upload.single("image"), function(req, res) {

    //req.file contains the details of the file uploaded
    cloudinary.uploader.upload(req.file.path, function(error, result) {
        // add cloudinary url for the image to the campground object under image property

        req.body.camp.img = result.secure_url;
        //result is what we are getting back from the cloudinary server, secure_url contains the location of the image
        req.body.camp.imgId = result.public_id; //with the public id we can delete that from the cloudinary
        //associate the user with the campground
        req.body.camp.author = {
            id: req.user._id,
            username: req.user.username
        }

        req.body.camp.name = req.body.camp.name.slice(0, 28);
        campModel.create(req.body.camp, function(err, camp) {
            if (err) {
                req.flash('error', err.message);
                return res.redirect('back');
            }
            req.flash("success", "SUCCESSFULLY ADDED!")
            res.redirect('/camps/' + camp._id);
        });

        const path = req.file.path;

        fs.unlink(path, (err) => {
            if (err) {
                console.error(err)
                return
            }
        })
    });
})


router.get('/new', isloggedIn, function(req, res) {
    res.render('campground/newcampground');
})

router.get('/:id', function(req, res) {
    console.log("Requested!!!")
    campModel.findById(req.params.id).populate("comment likes").exec(function(error, camp) {
        if (error)
            console.log(error);
        else {
            //console.log(camp);
            res.render("campground/thatcamp", { camp: camp })
        }
    })
})


//EDIT ROUTE

router.get("/:id/edit", checkownership, function(req, res) {
    campModel.findById(req.params.id, function(error, camp) {
        if (error) {
            console.log(error);
        } else {
            res.render("campground/edit", { camp: camp });
        }
    })
})

//UPDATE ROUTE
router.put("/:id", checkownership, upload.single("image"), function(req, res) {
    campModel.findById(req.params.id, function(error, camp) {
        if (error) {
            req.flash('error', error.message);
            return res.redirect("back");
        }
        if (req.file) { //if req.file exist which means that user uploaded the new image.
            cloudinary.uploader.destroy(camp.imgId, function(error) { //then delete the existing image in the cloudinary server
                if (error) {
                    req.flash('error', error.message);
                    return res.redirect("back");
                }
                cloudinary.uploader.upload(req.file.path, function(error1, result) { //then upload the new image provided by the user
                    if (error1) {
                        req.flash('error', error1.message);
                        return res.redirect("back");
                    }
                    camp.imgId = result.public_id;
                    camp.img = result.secure_url;
                    camp.name = req.body.camp.name.slice(0, 28);
                    camp.description = req.body.camp.description;
                    camp.save(function() {
                        //After saving we are to redirect it!
                        fs.unlink(req.file.path, function(err) {
                            if (err)
                                return res.redirect("back");
                            req.flash("success", "SUCCESSFULLY UPDATED!")
                            res.redirect("/camps/" + req.params.id);
                        });
                    })
                })
            })
        } else {
            camp.name = req.body.camp.name.slice(0, 28);
            camp.description = req.body.camp.description;
            camp.save(function() {
                //After saving we are to redirect it!
                req.flash("success", "SUCCESSFULLY UPDATED!");
                res.redirect("/camps/" + req.params.id);
            })
        }
        //we are doing this for the case when the user actually didn't uploaded the new image
    })
})


//DESTROY ROUTE
router.delete("/:id", checkownership, function(req, res) {
    //fistly deleting the associated comments
    campModel.findById(req.params.id, function(error, camp) {
            if (error) {
                console.log(error);
            } else {
                //also deleting the associated image from the cloudinary server
                cloudinary.uploader.destroy(camp.imgId, function(error) {
                    if (error) {
                        req.flash("error", error.message);
                        return res.redirect("back");
                    }
                })
                for (var i = 0; i < camp.comment.length; i++) {
                    commentModel.findByIdAndRemove(camp.comment[i], function(error) {
                        if (error) {
                            console.log(error);
                        }
                    })
                }
            }
        })
        //then removing the actual campground
    campModel.findByIdAndRemove(req.params.id, function(error) {
        if (error) {
            console.log(error);
        } else {
            req.flash("success", "DELETED SUCCESSFULLY!!");
            res.redirect("/camps/profile/1");
        }
    })
})

/*router.delete("/:id/sure", checkownership, function(req, res) {
    //We are populating the comment, to show the comments there.
    campModel.findById(req.params.id).populate("comment").exec(function(error, camp) {
        if (error)
            console.log(error);
        else {
            //console.log(camp);
            res.render("campground/suredelete.ejs", { camp: camp })
        }
    })
})*/



// FOR LIKE 

router.post("/:id/like/:x", isloggedIn, function(req, res) {

    campModel.findById(req.params.id, function(error, camp) {
        if (error) {
            console.log(error);
            return res.redirect("/camps");
        }

        //checking if the loged in user has already liked it or not
        var check;

        for (var i = 0; i < camp.likes.length; i++) {
            if (String(camp.likes[i]) == String(req.user._id)) {
                console.log("found");
                check = true;
                break;
            }
        }

        //checking if user's like exist in the campground.like array

        if (check) {
            // user already liked, removing his id from likes list in campgroounds
            camp.likes.pull(req.user._id);
        } else {
            //user hasn't liked and he/she is liking.
            camp.likes.push(req.user._id);
        }

        //final step is saving it and this is most important

        camp.save(function(error) {
            if (error) {
                console.log(error);
                return res.redirect("/camps");
            }

            //when the person likes from the home page, he is to redirect at the home page & when requested from allcamps page he is to redirect there, so by adding another
            //parameter x, we can achieve it.
            if (req.params.x == 1) {
                res.redirect("/camps");
            } else if (req.params.x == 2) {
                res.redirect("/camps/" + camp._id);
            } else {
                res.redirect("/camps/profile/1");
            }
        })
    })
})



//FOR USERPROFILE
router.get("/profile/1", isloggedIn, function(req, res) {
    var posts = [];
    campModel.find({}, function(error, camps) {
        if (error) {
            console.log(error);
        } else {
            for (var i = 0; i < camps.length; i++) {
                if (camps[i].author.username == req.user.username) {
                    posts.push(camps[i]);
                }
            }
            //console.log(posts)
            res.render("campground/userprofile", { posts: posts, form: "no" });
        }
    })
})

//ADD PROFILE PHOTO

router.get("/:id/addprofile", function(req, res) {
    var posts = [];
    campModel.find({}, function(error, camps) {
        if (error) {
            console.log(error);
        } else {
            for (var i = 0; i < camps.length; i++) {
                if (camps[i].author.username == req.user.username) {
                    posts.push(camps[i]);
                }
            }
            //console.log(posts)
            res.render("campground/userprofile", { posts: posts, form: "yes" });
        }
    })
})


router.post("/:id/addprofile/photo", isloggedIn, upload.single("image"), function(req, res) {
    //Deleting the existing profile pic in the server
    //cloudinary.uploader.destroy(user.imgId)
    cloudinary.uploader.upload(req.file.path, function(error, result) {
        var imgUrl = result.secure_url;
        userModel.findById(req.params.id, function(error, user) {
            if (error) {
                console.log(error);
            } else {
                cloudinary.uploader.destroy(user.imgId, function() {
                    user.img = imgUrl;
                    user.imgId = result.public_id;
                    user.save();
                    req.flash("success", "PROFILE PHOTO ADDED SUCCESSFULLY");
                    fs.unlink(req.file.path, function(err) {
                        if (err) throw err;
                        // we are deleting the file in the upload as there's no benefit of saving it when already it is added to the cloudinary
                        console.log('File deleted!');
                        res.redirect("/camps/profile/1");
                    });
                })
            }
        })
    })
})


//MIDDLEWARE ISLOGGEDIN
function isloggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else
    //the error messge is being sent under the key of error.
        req.flash("error", "You need to login first!!");
    res.redirect("/login");
}

//MIDDLEWARE FOR AUTHORIZATION (OWNERSHIP)

//only the author will have access to update, edit & delete the campground!
function checkownership(req, res, next) {
    //check if user logged in
    if (req.isAuthenticated() || req.currentUser.isAdmin) {
        //check if the current user is the creator of the campground
        campModel.findById(req.params.id, function(error, camp) {
            if (error) {
                console.log(error);
            } else {
                //the id of campground in author and _id of user is an string, so this method compares them taking this faactor in consideration.
                if (camp.author.id.equals(req.user._id) || req.user.isAdmin) { //buitl in method with mongoose
                    next();
                } else {
                    req.flash("error", "PERMISSION DENIED");
                    res.redirect("/camps/" + camp._id);
                }
            }
        })

    } else {
        req.flash("error", "YOU NEED TO LOG IN FIRST!")
        res.redirect("/camps");
    }
}


module.exports = router;