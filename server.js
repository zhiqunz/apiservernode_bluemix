var express = require("express");
var app = express();
var cfenv = require("cfenv");
var bodyParser = require('body-parser')

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

var cloudant, mydb;

/* Endpoint to greet and add a new visitor to database.
 * Send a POST request to localhost:3000/api/visitors with body
 * {
 *  "name": "Bob"
 * }
 */
app.post("/api/visitors", function(request, response) {
    var userName = request.body.name;
    var doc = { "name": userName };
    if (!mydb) {
        console.log("No database.");
        response.send(doc);
        return;
    }
    // insert the username as a document
    mydb.insert(doc, function(err, body, header) {
        if (err) {
            console.log('[mydb.insert] ', err.message);
            response.send("Error");
            return;
        }
        doc._id = body.id;
        response.send(doc);
    });
});

/**
 * Endpoint to get a JSON array of all the visitors in the database
 * REST API example:
 * <code>
 * GET http://localhost:3000/api/visitors
 * </code>
 *
 * Response:
 * [ "Bob", "Jane" ]
 * @return An array of all the visitor names
 */
app.get("/api/visitors", function(request, response) {
    var names = [];
    if (!mydb) {
        response.json(names);
        return;
    }

    mydb.list({ include_docs: true }, function(err, body) {
        if (!err) {
            body.rows.forEach(function(row) {
                if (row.doc.name)
                    names.push(row.doc.name);
            });
            response.json(names);
        }
    });
});

app.get("/api/userinfor", function(request, response) {
    let username = request.query.name;
    let userpwd = request.query.password;
    let userinfo = [];

    let tmparr = [{ "sitennmei": "丸の内支店（002）", "kouzabanngou": "1234567", "kamoku": "普通預金" }, { "sitennmei": "大手町支店", "kouzabanngou": "7654321", "kamoku": "当座預金" }]
    let test001info = { "Flag": 0, "NAME": "富士太郎", tmparr, "vip": 0 }

    tmparr = [{ "sitennmei": "日本橋支店", "kouzabanngou": "6666222", "kamoku": "普通預金" }, { "sitennmei": "大伝馬町支店", "kouzabanngou": "8888333", "kamoku": "当座預金" }]
    let test002info = { "Flag": 0, "NAME": "東京テスト", tmparr, "vip": 1 }

    userinfo.push([{ "Flag": 1 },]);

    if (username && userpwd) {
        if (["test001", "test002"].includes(username)) {
            if (userpwd === "test001" && username === "test001") {
                
                userinfo.splice(0, 1, test001info)
            }
            if (userpwd === "test002" && username === "test002") {
                
                userinfo.splice(0, 1, test002info)
            }

        }
    };

    response.json(userinfo);
    return;
})

app.get("/api/channel", function(request, response) {

    let kinngaku = Number(request.query.kinngaku);
    let atmchanel = [{ "Flag": 0, "toriatukaichannel": "ATM" }, ];
    let winchanel = [{ "Flag": 0, "toriatukaichannel": "WIN" }, ];
    if (kinngaku && typeof(kinngaku) === 'number') {
        if (kinngaku <= 500000) {
            response.json(atmchanel);
        } else {
            response.json(winchanel);
        }
    } else {
        response.json([{ "Flag": 1 },]);
    }

    return;
})


app.get("/api/qrcode",function(request,response){
  let atmcashfilename="201809261807387452hnNUad.png";
  let wincashfilename="201809261807573096CfexAp.png";
  let vipfilename="201809261808127772CDnZki.png";
  let linksfilename="201809261808247887pAbnzM.png";

  let torihikinaiyou = request.query.torihikinaiyou;
  let toriatukaichannel = request.query.toriatukaichannel; 

  if ( torihikinaiyou === "現金引き出し" && toriatukaichannel === "ATM"){
    response.sendfile(atmcashfilename);  
  } else if ( torihikinaiyou === "現金引き出し" && toriatukaichannel === "WIN"){
    response.sendfile(wincashfilename);  
  } else if ( torihikinaiyou === "ローン" && toriatukaichannel === "VIP"){
    response.sendfile(vipfilename);  
  } else if ( torihikinaiyou === "ローン" && toriatukaichannel === "LINKS"){
    response.sendfile(linksfilename);  
  } else {
    response.send("please correct torihikinaiyou and toriatukaichannel")
  }
  return;
  
  
})


// load local VCAP configuration  and service credentials
var vcapLocal;
try {
    vcapLocal = require('./vcap-local.json');
    console.log("Loaded local VCAP", vcapLocal);
} catch (e) {}

const appEnvOpts = vcapLocal ? { vcap: vcapLocal } : {}

const appEnv = cfenv.getAppEnv(appEnvOpts);

// Load the Cloudant library.
var Cloudant = require('@cloudant/cloudant');
if (appEnv.services['cloudantNoSQLDB'] || appEnv.getService(/cloudant/)) {

    // Initialize database with credentials
    if (appEnv.services['cloudantNoSQLDB']) {
        // CF service named 'cloudantNoSQLDB'
        cloudant = Cloudant(appEnv.services['cloudantNoSQLDB'][0].credentials);
    } else {
        // user-provided service with 'cloudant' in its name
        cloudant = Cloudant(appEnv.getService(/cloudant/).credentials);
    }
} else if (process.env.CLOUDANT_URL) {
    cloudant = Cloudant(process.env.CLOUDANT_URL);
}
if (cloudant) {
    //database name
    var dbName = 'mydb';

    // Create a new "mydb" database.
    cloudant.db.create(dbName, function(err, data) {
        if (!err) //err if database doesn't already exists
            console.log("Created database: " + dbName);
    });

    // Specify the database we are going to use (mydb)...
    mydb = cloudant.db.use(dbName);
}

//serve static file (index.html, images, css)
app.use(express.static(__dirname + '/views'));



var port = process.env.PORT || 3000
app.listen(port, function() {
    console.log("To view your app, open this link in your browser: http://localhost:" + port);
});