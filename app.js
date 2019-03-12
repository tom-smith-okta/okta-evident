////////////////////////////////////////////////////

require('dotenv').config()

const bodyParser = require('body-parser')

const express = require('express')

const fs = require('fs')

// var morgan = require('morgan')

const request = require('request')

///////////////////////////////////////////////////

// SET UP WEB SERVER
const app = express()

var port = process.env.PORT

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use(express.static('public'))

// app.use(morgan('combined'))

app.listen(port, function () {
	console.log('App listening on port ' + port + '...');
})

///////////////////////////////////////////////////

var records_img_url = "https://s3.amazonaws.com/tom-smith-okta-demo-images/evident/medical_record500.jpg"

var schedule_img_url = "https://s3.amazonaws.com/tom-smith-okta-demo-images/evident/calendar300.png"

///////////////////////////////////////////////////

app.get('/', function (req, res) {

	fs.readFile('html/index.html', "utf8", (err, page) => {
		if (err) {
			console.log("error reading the index.html file")
		}

		page = page.replace(/{{OKTA_TENANT}}/g, process.env.OKTA_TENANT)
		page = page.replace(/{{REDIRECT_URI}}/g, process.env.REDIRECT_URI)
		page = page.replace(/{{CLIENT_ID}}/g, process.env.CLIENT_ID)

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
