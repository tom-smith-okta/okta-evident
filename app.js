////////////////////////////////////////////////////

require('dotenv').config()

const bodyParser = require('body-parser')

const express = require('express')

const fs = require('fs')

const OktaAuth = require('@okta/okta-auth-js')

const okta = require('@okta/okta-sdk-nodejs')

var morgan = require('morgan')

const request = require('request')

///////////////////////////////////////////////////

// SET UP WEB SERVER
const app = express()

var port = process.env.PORT

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use(express.static('public'))

app.use(morgan('combined'))

app.listen(port, function () {
	console.log('App listening on port ' + port + '...');
})

///////////////////////////////////////////////////

// Okta clients

const authClient = new OktaAuth({ url: process.env.OKTA_TENANT })

const client = new okta.Client({
	orgUrl: process.env.OKTA_TENANT,
	token: process.env.OKTA_API_TOKEN,
	requestExecutor: new okta.DefaultRequestExecutor() // Will be added by default in 2.0
});

//////////////////////////////////////////////////

var records_img_url = "https://s3.amazonaws.com/tom-smith-okta-demo-images/evident/medical_record500.jpg"

var schedule_img_url = "https://s3.amazonaws.com/tom-smith-okta-demo-images/evident/calendar300.png"

app.get('/', function (req, res) {

	fs.readFile('html/index.html', "utf8", (err, page) => {
		if (err) {
			console.log("error reading the index.html file")
		}

		page = page.replace(/{{OKTA_TENANT}}/g, process.env.OKTA_TENANT)
		page = page.replace(/{{REDIRECT_URI}}/g, process.env.REDIRECT_URI)
		page = page.replace(/{{CLIENT_ID}}/g, process.env.CLIENT_ID)

		page = page.replace(/{{APP_HOME}}/g, process.env.APP_HOME)

		res.send(page)
	})
})

app.post('/records', function (req, res) {

	console.log("the request body is: ")
	console.dir(req.body)

	var options = {
		method: 'POST',
		url: process.env.OKTA_TENANT + '/oauth2/v1/introspect',
		qs: {
			token: req.body.id_token,
			token_type_hint: 'id_token',
			client_id: process.env.CLIENT_ID,
			client_secret: process.env.CLIENT_SECRET
		},
		headers: {
			'cache-control': 'no-cache',
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json'
		}
	}

	request(options, function (error, response, body) {
		if (error) throw new Error(error)

		console.log(body)

		var obj = JSON.parse(body)

		var errMsg = "<p>sorry, for your security, you need to go through the identity proofing process before seeing your medical records.</p>"

		if (obj.active === true) {
			console.log("the id token is active.")

			if (obj.proofed) {
				if (obj.proofed === "true") {
					res.json({html: "<img src='" + records_img_url + "'>"})
					return
				}
			}
		}
		res.json({html: errMsg})
	})
})


app.post('/schedule', function (req, res) {

	console.log("the request body is: ")
	console.dir(req.body)

	var options = {
		method: 'POST',
		url: process.env.OKTA_TENANT + '/oauth2/v1/introspect',
		qs: {
			token: req.body.id_token,
			token_type_hint: 'id_token',
			client_id: process.env.CLIENT_ID,
			client_secret: process.env.CLIENT_SECRET
		},
		headers: {
			'cache-control': 'no-cache',
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json'
		}
	}

	request(options, function (error, response, body) {
		if (error) throw new Error(error)

		console.log(body)

		var obj = JSON.parse(body)

		if (obj.active === true) {
			console.log("the id token is active.")
			res.json({html: "<img src='" + schedule_img_url + "'>"})
		}
		else {
			res.json({html: "<p>sorry, you need to be logged in to schedule an appointment.</p>"})
		}
	})
})

app.post('/register', function (req, res) {

	console.log("the request body is: ")

	console.dir(req.body)

	const newUser = {
		profile: {
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			email: req.body.email,
			login: req.body.email
		},
		credentials: {
			password : {
				value: req.body.password
			}
		}
	}

	client.createUser(newUser)
	.then(user => {
		console.log('Created user', user)

		authClient.signIn({
			username: req.body.email,
			password: req.body.password
		})
		.then(function(transaction) {
			if (transaction.status === 'SUCCESS') {
				console.log("the transaction is: ")
				console.dir(transaction)

				console.log("the sessionToken is: " + transaction.sessionToken)

				var session_cookie_uri = process.env.OKTA_TENANT + "/login/sessionCookieRedirect?token=" + transaction.sessionToken + "&redirectUrl=" + process.env.APP_HOME

				req.session.authn = 1
				req.session.user_id = transaction.user.id

				console.log("the value of req.session is: " + req.session.authn)

				console.log("the user id is: " + req.session.user_id)

				res.redirect(session_cookie_uri)

			} else {
				throw 'We cannot handle the ' + transaction.status + ' status';
			}
		})
		.fail(function(err) {
			console.error(err);
		})
	})
})
