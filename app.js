////////////////////////////////////////////////////

require('dotenv').config()

const bodyParser = require('body-parser')

const express = require('express')

var session = require('express-session')

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

app.use(session({ secret: process.env.SECRET_PHRASE, cookie: { maxAge: 60000 }}))

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

app.get('/', function (req, res) {

	fs.readFile('html/index.html', "utf8", (err, page) => {
		if (err) {
			console.log("error reading the index.html file")
		}

		page = page.replace(/{{OKTA_TENANT}}/g, process.env.OKTA_TENANT)
		page = page.replace(/{{APP_HOME}}/g, process.env.APP_HOME)

		res.send(page)
	})
})

app.get('/schedule', function (req, res) {

	if (req.session.authn === 1) {
		res.send("you are authenticated!")
	}

	else {
		res.send("you are NOT authenticated!")
	}

	// fs.readFile('html/index.html', "utf8", (err, page) => {
	// 	if (err) {
	// 		console.log("error reading the index.html file")
	// 	}

	// 	page = page.replace(/{{OKTA_TENANT}}/g, process.env.OKTA_TENANT)
	// 	page = page.replace(/{{APP_HOME}}/g, process.env.APP_HOME)

	// 	res.send(page)
	// })
})

app.get('/log_in', function (req, res) {

	fs.readFile('html/log_in.html', "utf8", (err, page) => {
		if (err) {
			console.log("error reading the index.html file")
		}

		page = page.replace(/{{OKTA_TENANT}}/g, process.env.OKTA_TENANT)
		page = page.replace(/{{APP_HOME}}/g, process.env.APP_HOME)

		res.send(page)
	})

	// fs.readFile('html/index.html', "utf8", (err, page) => {
	// 	if (err) {
	// 		console.log("error reading the index.html file")
	// 	}

	// 	page = page.replace(/{{OKTA_TENANT}}/g, process.env.OKTA_TENANT)
	// 	page = page.replace(/{{APP_HOME}}/g, process.env.APP_HOME)

	// 	res.send(page)
	// })
})

app.post('/log_out', function (req, res) {

	req.session.authn = 0

	req.session.user_id = ""

	console.log("killed the server-side session.")

	res.json({msg: "success"})

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
