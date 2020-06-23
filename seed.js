var campModel = require("./models/campground");
var commentModel = require('./models/comments.js')








function SeedDB() {
    //deleting all existing campgrounds
    campModel.remove({}, function(error) {
        if (error) {
            console.log(error);
        } else {
            console.log("Deleted the campgrounds!!!!!");
            camps.forEach(function(data) {
                campModel.create(data, function(err, camp) {
                    if (err)
                        console.log(err);
                    else
                        console.log("Added the campground");
                    commentModel.create({
                        text: "This is best place",
                        author: "robert"
                    }, function(error, com) {
                        if (error) {
                            console.log(error)
                        } else {
                            camp.comment.push(com);
                            camp.save(function(error) {
                                if (error)
                                    console.log(error)
                                else
                                    console.log('SAVED!!!!');
                            });
                            console.log("Comment created!");
                        }
                    })
                })
            })
        }
    })
}

module.exports = SeedDB;