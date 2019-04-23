# Okta + Evident #

## Overview ##

This sample application demonstrates how Okta can integrate with Evident for ID proofing.

The application shows an end-user flow with a mock UI where an end-user initially registers and is immediately able to access limited resources (schedule an appointment). To access more privileged resources (view my medical records), the user must prove their identity through Evident.

The essential connection happens when Okta sends an event hook to Evident after the user registers. Evident accepts the web hook and sends the user an email with a link to the Evident online identity proofing process. When the user completes the identity proofing process, Evident updates the Okta user record with the results of the process.

Assuming all went well, the user is now able to access the more privileged resources.

## Prerequisites ##

* An Okta account
* An Evident account

## Setup ##

1. In your Okta tenant, set up a custom field in the user profile like `verification_status`. In this example, the initial value of `verification_status` is `undefined`. Evident updates this field with `true` or `false`.

2. Set up an event hook in your Okta tenant. The webhook should listen for the event `user.lifecycle.activate`. You will need to work with Evident to get and verify the appropriate destination uri.

## The application ##

This sample Node.js application is restricting access to the `schedule an appointment` resource by looking for a valid id token from Okta.

It is securing access to the `view medical records` resource by looking for a valid id token from Okta, and then making an API call to Okta to retrieve the user record. This would not be an appropriate setup for production; it's just meant to illustrate the id proofing process.

Also - the web page is polling Okta to see if the Okta user record has been updated.
