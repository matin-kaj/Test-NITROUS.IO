var MongoClient = require('mongodb').MongoClient;

var express = require('express'),
http = require('http'),
    path = require('path'),
    fs = require("fs"),
    path = require("path"),
    connect = require("connect"),
    _ = require("underscore");


var app = express();

// all environments


function error(status, message, res) {
    res.send(message);
}

function frontPage(res, collection1) {

    collection1.find({}, {
        _id: 0
    }).sort({
        score: -1
    }).toArray(function (err, results) {
       // console.dir(results);
        res.render("frontPage", {
            bookmarks: results
        });
    });

}

function vote(title, direction, res, collection1) {
    if (direction === "up") {
        collection1.update({
            title: title
        }, {
            $inc: {
                score: 1
            }
        }, function (err, obj) {
            if (err) throw err;

            res.redirect("/");
        });
    } else {
        collection1.update({
            title: title
        }, {
            $inc: {
                score: -1
            }
        }, function (err, obj) {
            if (err) throw err;

            res.redirect("/");
        });

    }
}

function signup(username, password, res, collection2) {

    collection2.find({username:username}, {
        _id: 0
    }).toArray(function (err, results) {
       console.log("FOUND");
    

    if (results.length > 0) {
            error(403, "This user already has benn taken", res);
            return;
        }

    collection2.insert({
        "username": username,
        "password": password
    }, {
        w: 1
    }, function (err, result) {});

    res.redirect("/");
    });
}

function submit(title, link, res, collection1) {
    collection1.find({url: link}, {
        _id: 0
    }).toArray(function (err, bookmarks) {
        console.log("FOUND");

        if (bookmarks.length > 0) {
            error(409, "Link has already been submitted", res);
            return;
        }
        var book = {
            "title": title,
            "url": link,
            "score": 0
        };


        collection1.insert(book, {
            w: 1
        }, function (err, result) {
            if (err) {
                console.log(err);
            } else {
                console.log("It is inserted to the DB");
            }
        });
        res.redirect("/");        

    });


}


app.configure(function () {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.set('view options', {
        layout: false
    });
    app.use(express.logger());
    app.use(express.favicon());
    app.use(express.bodyParser());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
    app.use(function (req, res, next) {
        res.locals._ = require('underscore');
        next();
    });
    
});

MongoClient.connect("mongodb://localhost:27017/test", function (err, db) {
    if (err) {
        return console.dir(err);
    }
    var collection1 = db.collection('bookmarks');
    var collection2 = db.collection('account');

    app.use(function (err, req, res, next) {

        res.send(500, 'something broke');
    });

    app.get('/', function (req, res) {
        frontPage(res, collection1);
    });

    app.post('/vote', function (req, res) {
        vote(req.body.title, req.body.direction, res, collection1);
    });

    app.post('/signup', function (req, res) {
        signup(req.body.username, req.body.password, res, collection2);
    });

    app.get('/signup', function (req, res) {
        res.render("signup");
    });


    app.get('/submit', function (req, res, next) {
        if (req.url !==null) {
            var auth =express.basicAuth(function(username, password,fn){
                console.log(".,.,.,.,.,username.,.,.,."+username);
            collection2.find({username:username}, {
        _id: 0
    }).toArray(function (err, results) {
                console.dir(results);

                if(err){
                    fn(err,null);
                }
                if(results.password===password && results.username===username){
                    fn(null,username);
                }
                else {
                    fn(null,null);
                }
                    });

    });
    
            auth(req, res, next);
        } else {
            return next();
        }

    });
        app.get('/comment/:title', function (req, res) {
        var title = req.params.title;
        res.render('comment', {
            title: title
        });
    });
    app.post('/submit', function (req, res) {
        submit(req.body.title, req.body.link, res, collection1);
    });

    app.get('/submit', function (req, res) {
        res.render("submit");
    });
    /* this is another comment */
    app.listen(3000);
});
