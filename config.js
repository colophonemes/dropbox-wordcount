// Configuration file


var config = {
/////////////////////////////////////////////



// Beeminder Auth
	beeminderOptions : {
		// auth -> get this from https://www.beeminder.com/api/v1/auth_token.json
		auth : {"username":"username","auth_token":"abcdef123456"},
		// apiUrl -> don't change this...
		apiUrl : 'https://www.beeminder.com/api/v1/',
		// goal -> Your beeminder goal name
		goal : 'writing'
 	},



// Dropbox auth
// You will need to create a Dropbox App, and generate a token using Implicit oAuth
 dropBoxOptions : {
		key: 'xxxxx',
		secret: 'xxxxx',
		token: 'xxxxxxxx-xxxxxx',
		sandbox : false
	},

// Dropbox folder (set this to the folder you keep your writing files in)
// !! important - this script doesn't do any directory traversal, so make sure you've just got one folder that everything lives in
 dropBoxPath : "/Writing",


// Database name. You can change this if you want I guess...
 dbName :  "writing_db.json"

/////////////////////////////////////////////
};

module.exports = config;