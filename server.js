'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');

var cors = require('cors');

var bodyParser = require('body-parser');


var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.DB_URI);
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }); 

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});


//-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

var Schema = mongoose.Schema;
var User = mongoose.model('User', 
                                new Schema({ username: String, 
                                             exercises : [{ type: Schema.Types.ObjectId, ref: 'Exercise' }] }) );
var Exercise = mongoose.model('Exercise', 
                                    new Schema({ userId : [{ type: Schema.Types.ObjectId, ref: 'User' }], 
                                                 description: String, duration: Number, 
                                                 date: Date }) ); 


app.post("/api/exercise/new-user", function(req, res) {
  var username = req.body.username;
  //console.log(username)
  
  if (username !== ""){
    User.findOne({ username: username }, function(err, usernameFound) {
       if (err) {
         res.json( {"error": "Could not search in database"} );
       }
      
       if (usernameFound) {
         res.json({ username: usernameFound.username, _id: usernameFound.id});
       } else {
         var newEntry = new User({username: username});
         newEntry.save(function(err, doc){
           if(err) {
             res.json( {"error": "Could not save to database"} );
           }else{
             res.json({username: newEntry.username, "_id": doc.id});
           }
         })
       }
    })
  }
})

app.get("/api/exercise/users", function(req, res) {
  var query = User.find({})
  query.select("username _id")
  query.exec(function(err, users) {
    var userMap = [];

    users.forEach(function(user) {
      userMap.push(user);
    });

    res.json(userMap); 
  })
})

app.post("/api/exercise/add", function(req, res) {
  var userId = req.body.userId;
  var description = req.body.description;
  var duration = req.body.duration;
  var date = req.body.date;
  var exerciseId = "";
  
  
  
  if (userId !== "" && description !== "" && duration !== ""){
  
    if (date === "" || date === null) {
      date = new Date();
    } else if (date.toString() === "Invalid Date") {
      res.json({"error" : "Invalid Date" }) 
    } else {
      date = new Date(date)
    }
    
    if (/^[0-9]+$/.test(duration) === false) {
      res.json({"error" : "Invalid Duration" }) 
    }
    
    User.findOne({ _id: userId }, function(err, userFound) {
       if (err) {
         res.json({"error": "Could not find in database"})
       }
      
       if (userFound) {
                   
           var newEntry = new Exercise({ userId: userId, description: description, duration: duration, date: date });
           newEntry.save(function(err, doc){
             if(err) {
               res.json( {"error": "Could not save to database"} );
             }
               res.json({userId: userId, description: description, duration: duration, date: date, username: userFound.username })           
           })                                 
       } else {
         res.json({ "error": "Could not find user" }); 
       }
    })
  }
})

app.get("/api/exercise/log", function(req, res){
  var userId = req.query.userId
  var dateFrom = req.query.from
  var dateTo = req.query.to
  var numberOfParameters = Object.keys(req.query).length
  var limit = -1;
  
  console.log(dateTo)
  
  if (dateFrom === "" || dateFrom === undefined) {
    dateFrom = new Date(0);
  } else if (dateFrom.toString() === "Invalid Date") {
    res.json({"error" : "Invalid From-Date" }) 
  } else {
    dateFrom = new Date(dateFrom)
  }
  
  if (dateTo === "" || dateTo === undefined) {
    dateTo = new Date();
  } else if (dateTo.toString() === "Invalid Date") {
    res.json({"error" : "Invalid From-Date" }) 
  } else {
    dateTo = new Date(dateTo)
  }
  
  if (dateFrom > dateTo) {
    res.json({"error" : "Invalid Dates" }) 
  }
  
  Exercise.find({ userId: userId}, function(err, exerciseFound){
    var exerciseMap = [];
    
    if (req.query.limit <= exerciseFound.length) {
      limit = req.query.limit
    } else {
      limit = exerciseFound.length
    }
    for (var i = 0; i < limit; i++) {
      if (dateFrom <= exerciseFound[i].date && dateTo >= exerciseFound[i].date){
        exerciseMap.push(exerciseFound[i])
      }
    }    
               
    res.json(exerciseMap);
  })
})
