# Bill

a [Sails](http://sailsjs.org) application

## Api Endpoints

* *POST* /user/login
  * Log a user in and get authentication token.
  * Data - {email:email,password:password}
* *POST* /user/create
  * Create a new user.
  * Data - {firstName:name,lastName:name,email:email,password:password}
* *POST* /user/send_reset
  * Sends a password reset email to the user
  * Data - {email:email}
* *POST* /user/reset
  * Resets a user password given a token from the password reset email and a new password.
  * Data - {token:token,password:password}
* *POST* /user/verify
  * Verifies a user's email based on their initial email token.
  * Data - {token:sptoken}
* *POST* /user/resend
  * Resends the email verification email given a user's email.
  * Data - {email:email}
