/**
 * User_authController
 *
 * @description :: Server-side logic for managing user_auths
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var node_cryptojs = require('node-cryptojs-aes');
var CryptoJS = node_cryptojs.CryptoJS;
var JsonFormatter = node_cryptojs.JsonFormatter;
var stormpath = require('stormpath');
var request = require("request");

module.exports = {

  getAuthApp: function(){
    var apiKey = new stormpath.ApiKey(
      sails.config.stormpath['STORMPATH_CLIENT_APIKEY_ID'],
      sails.config.stormpath['STORMPATH_CLIENT_APIKEY_SECRET']
    );

    var client = new stormpath.Client({ apiKey: apiKey });
    var applicationHref = sails.config.stormpath['STORMPATH_APPLICATION_HREF'];
    return {client:client, applicationHref: applicationHref};

  },

  createUser: function(req, res){

    var client = this.getAuthApp();
    var data = req.body;
    var token = req.body.token;

    client.client.getApplication(client.applicationHref, function(err, application) {
      var account = {
        givenName: data.firstName,
        surname: data.lastName,
        email: data.email,
        password: data.password
      };
      application.createAccount(account, function(err, createdAccount) {
          if(err){
            console.log(err);
            return res.send(503, {error: err.userMessage});
          } else {
            return res.send(200, {message: 'User created'});
          }
      });
    });

  },

  getUser: function(data){
    var application = this.getAuthApp();

    application.getAccounts({email:data.email}, function(err, accounts) {
      accounts.each(function(account, callback) {
        console.log('Account:', account);
        callback();
      }, function(err) {
        console.log('Finished iterating over accounts.');
      });
    });
  },

  verifyEmail: function(req,res){
    var data = req.body;
    var sptoken = data.token;

    request.post({url:"https://api.stormpath.com/v1/accounts/emailVerificationTokens/"+sptoken},function(err,response,body){
      if (err){
        console.log(err);
        res.send(503,{error:err.userMessage});
      }else{
        res.send(200,{success:true});
      }
    });
  },

  resendVerifyEmail: function(req,res){
    var data = req.body;
    var email = data.email;

    request({url:sails.config.stormpath["STORMPATH_APPLICATION_HREF"]+"/verificationEmails",form:{login:email}},function(err,response,body){
      if (err){
        res.send(503,{error:err.userMessage});
      }else{
        res.send(200,{success:true});
      }
    });
  },

  authUser: function(req, res){

    var client = this.getAuthApp()
    var data = req.body;
    var formatter = this.formatter();

    var authRequest = {
      email: data.email,
      password: data.password
    };

    client.client.getApplication(client.applicationHref, function(err, application) {
      application.authenticateAccount(authRequest, function(err, result) {
        // If successful, the authentication result will have a method,
        // getAccount(), for getting the authenticated account.
        if(err){
            console.log(err);
            res.send(503, {error: err.userMessage});
        } else {
          result.getAccount(function(err, account) {
            if(err){
              console.log(err);
              res.send(401, {error: err.userMessage});
            } else {
              if(account.status === "ENABLED"){
                var user = {
                  email: account.email,
                  status: account.status,
                  timestamp: new Date().getTime(),
                  href: account.href
                }
                var key = sails.config.crypto['CRYPTO_KEY'];
                var obj = {};

                var encrypted = CryptoJS.AES.encrypt(JSON.stringify(user), key, { format: JsonFormatter });
                var encrypted_json_str = encrypted.toString();

                res.send(200, {account: encrypted_json_str});
              } else {
                res.send(401, {error: 'User account disabled'});
              }
            }
          });
        }
      });
    });
  },

  sendUserReset: function(data){

    var application = this.getAuthApp();

    var email = data.email;

    application.sendPasswordResetEmail({ email: email }, function(err, passwordResetToken) {
      // The token is the last part of the HREF.
      console.log(passwordResetToken.href.split('/').pop());

      // The account can be retrieved by using the getAccount() method.
      client.getAccount(passwordResetToken.account.href, function(err, account) {
        console.log('Account:', account);
      });
    });
  },

  resetPassword: function(){

    var application = this.getAuthApp();
    var token = req.body.token;
    var password = req.body.password;

    application.resetPassword(token, password, function(err, result) {
      if (err) {
        // The token has been used or is expired - have the user request a new token.
        return console.error(err);
      }

      // The response contains a link to the account which is
      // associated with this password reset workflow.
      console.log('Account HREF:', result.account.href);
    });

  },

  setAuth: function(account){

  },

  /* if we want beta tokens or something*/
  validToken: function(token){

    return true;

  },

  formatter: function(){
    return {
        stringify: function (cipherParams) {
            console.log(cipherParams);
            // create json object with ciphertext
            var jsonObj = {
                ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64)
            };

            // optionally add iv and salt
            if (cipherParams.iv) {
                jsonObj.iv = cipherParams.iv.toString();
            }
            if (cipherParams.salt) {
                jsonObj.s = cipherParams.salt.toString();
            }

            // stringify json object
            return JSON.stringify(jsonObj);
        },

        parse: function (jsonStr) {
            // parse json string
            var jsonObj = JSON.parse(jsonStr);

            // extract ciphertext from json object, and create cipher params object
            var cipherParams = CryptoJS.lib.CipherParams.create({
                ciphertext: CryptoJS.enc.Base64.parse(jsonObj.ct)
            });

            // optionally extract iv and salt
            if (jsonObj.iv) {
                cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv)
            }
            if (jsonObj.s) {
                cipherParams.salt = CryptoJS.enc.Hex.parse(jsonObj.s)
            }

            return cipherParams;
        }
    };
  }


};
