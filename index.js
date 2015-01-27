 var Dropbox = require("dropbox");
 var express = require("express");
 var app = express();
 var crypto = require('crypto');
 var request = require('request');
 var config = require('./config');

// Beeminder Auth
 var BEEMINDER_AUTH = config.beeminderOptions.auth, //get this from https://www.beeminder.com/api/v1/auth_token.json
 	 BEEMINDER_API_URL = config.beeminderOptions.apiUrl,
 	 BEEMINDER_GOAL = config.beeminderOptions.goal;  // Your beeminder goal name here

// Dropbox auth
// You will need to create a Dropbox App, and generate a token using Implicit oAuth
var client = new Dropbox.Client(config.dropBoxOptions);


client.onError.addListener(function(error) {
    console.error(error);
});

var PATH = config.dropBoxPath,
	DB_NAME = config.dbName;



var sha1 = function(text){
		sha = crypto.createHash('sha1');
		sha.update(text,'utf8');
		return sha.digest('hex');
};

var wordcount = function(str){
	return str.match(/\S+/g).length;
};


var db = {},
	difference = 0;

var readDB = function(callback){
	// check to see if the database file exists
	client.readFile(PATH + '/' + DB_NAME, function(error, data) {
		if(error && error.status === Dropbox.ApiError.NOT_FOUND){
			client.readdir(PATH, function(error,entries){
				return (
					buildDB( entries, function(database){
						console.log('DB file did not exist, creating new one...\n');
						return (
							writeDB(database,function(database){
								db = database;
							})
						);
					} )
				);
				
			});
		}
		else {
			db = JSON.parse(data);
			console.log('Database OK');
			return ( callback() );
		}
	});
}

var buildDB = function(entries, callback){
	var database = {};
	function readEntry(entry){
		if(entry){

			if(entry == DB_NAME){
				readEntry( entries.shift() );
				return;
			}
			console.log('##', entry, "##");
			var n = sha1(entry),
				wc = 0,
				new_entry = (db.hasOwnProperty(n) ? false : true);

			if(new_entry){
				console.log(entry + ' not in database');
			}
			database[n] = {};

			database[n]['name'] = entry;
			client.readFile(PATH + '/' + entry, function(error, data) {
				if(error){
					return;
				}
				wc = wordcount(data);
				console.log(wc + ' words');

				if(new_entry){
					database[n]['last_wordcount'] = 0;
					database[n]['current_wordcount'] = wc;
				} else {
					database[n]['last_wordcount'] = db[n]['current_wordcount'];
					database[n]['current_wordcount'] = wc;
				}
				readEntry( entries.shift() );
			});
		} else {
			console.log('Finished building database...\n\n\n');
			callback(database);
		}
	}
	readEntry(entries.shift());
};

var writeDB = function(database,callback){
	console.log('Writing database...');
	return(
		client.writeFile(PATH + '/' + DB_NAME, JSON.stringify(database,null,'\t'),function(error,stat){
			console.log("File saved as revision " + stat.versionTag + '\n\n');
			if(callback){
				return callback(database);
			}
		})
	);
};

// var setDB = function(database){
// 	console.log('Setting main db object');
// 	db = database;
// 	return;
// }

var compareDB = function(callback){
	return(
		client.readdir(PATH, function(error,entries){
			return(
				buildDB( entries, function(database){
					difference = 0;
					var changedDocs = [],x;
					for(key in database) {
						x = Math.abs(database[key].current_wordcount - database[key].last_wordcount);
						difference += x;
						if(x>0){
							changedDocs.push(database[key].name);
						}
					}
					console.log('Difference = ',difference,'\nChanged docs:',changedDocs.join() );
					return(
						writeDB(database,function(database){
							db = database;
							if(callback){
								return ( callback(difference,changedDocs) );
							}
						})
					);
				})
			);
		})
	);
}


var doWordcount = function(callback){
	return(
		// make sure we're authenticated
		client.authenticate(function(error, client) {
			console.log('connected...');
			return (
				// Say hi!
				client.getAccountInfo(function(error, accountInfo) {
				  console.log("Hello, " + accountInfo.name + "!\n\n");
					return (
						// read the DB into the db var
						readDB(function(){
							return (
								compareDB(function(difference,changedDocs){
									if(callback){
										return callback(difference,changedDocs);
									}
								}) 
							);
						})
					);

				})
			);
		
		})
	);
};


var pingBeeminder = function(type,callback){

	if(type=='wordcount'){
		return (
			doWordcount(function(difference,changedDocs){
				if( difference > 0){
					var url = BEEMINDER_API_URL + 'users/' + BEEMINDER_AUTH.username + '/goals/' + BEEMINDER_GOAL + '/datapoints.json?auth_token=' + BEEMINDER_AUTH.auth_token,
						options = {
									form : {
										"value" : difference,
										"comment" : changedDocs.join(', ')
									}
								  };
					console.log('Attempting to ping beeminder...');
					return (
						request.post(url,options,function(error,response,body){
							console.log('Beeminder response: ',response.statusCode);
						})
					);
				} else {
					console.log('No datapoint created, difference was 0');
				}
			})
		);
	}
	if(callback){
		return callback(type);
	}
};


 /* serves main page */
 app.get("/", function(req, res) {
	res.send('Permission denied')
 });


 /* serves main page */
 app.get("/wordcount", function(req, res) {
 	pingBeeminder('wordcount', function(d){
 		res.send('pinging beeminder... (function call was ' + d);
 	});
 });

 /* serves all the static files */
 app.get(/^(.+)$/, function(req, res){ 
	 console.log('static file request : ' + req.params);
	 res.sendfile( __dirname + req.params[0]); 
 });

 var port = process.env.PORT || 5000;
 app.listen(port, function() {
   console.log("Listening on " + port);
 });


