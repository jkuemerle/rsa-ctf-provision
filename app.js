const express = require("express");
const app = express();
const https = require('https');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const fn = require('./functions');
const netrc = require('netrc');
const passport = require('passport'), BasicStrategy = require('passport-http').BasicStrategy;

const TEST_ENV = (process.env.CTF_ENVIRONMENT && (process.env.CTF_ENVIRONMENT === "DEV") || (process.env.CTF_ENVIRONMENT === "LOCAL") ) ? true : false;
const LOCAL_ENV = (process.env.CTF_ENVIRONMENT && process.env.CTF_ENVIRONMENT === "LOCAL" ) ? true : false;

const serverPort = process.env.PORT ? process.env.PORT : 4020;

const USER_NAME = process.env.USER_NAME;
const USER_PASSWORD = process.env.USER_PASSWORD;

var netrcLocation = path.join(process.env.HOME, '_netrc');
var myNetrc;
if(fs.existsSync(netrcLocation)) {
    myNetrc = netrc(netrcLocation);
}

const HEROKU_TOKEN = process.env.HEROKU_TOKEN ? process.env.HEROKU_TOKEN : myNetrc ?  myNetrc['api.heroku.com'].password : "" ;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

passport.use(new BasicStrategy(
    function(username, password, done) {
      if(username == USER_NAME && password == USER_PASSWORD ) {
          return done(null,username);
      }
      return done(null, false);
    }
  ));

if(LOCAL_ENV) {
    app.listen(serverPort, () => console.log(`app listening on port ${serverPort}!`))
} else {
    app.listen(serverPort, () => console.log(`app listening on port ${serverPort}!`))
}
app.use(express.static('public'));

console.log('Provision app listening on port ' + serverPort + '! Go to http://localhost:' + serverPort)

app.post('/api/newCTFd',
  passport.authenticate('basic', { session: false }),
  function(req, res) {
    fn.createCTFd({ herokuToken: HEROKU_TOKEN}, {importID: 'RSA2020', url: 'https://rsa-ctf-provision.herokuapp.com/ctfd.tar.gz' }).then(ret => {
        res.json({ name: ret.name, id: ret.id, web_url: ret.web_url});
        res.end();
    }).catch(err => {
        res.sendStatus(500);
        res.end;
    });
  });

app.post('/api/newJS',
  passport.authenticate('basic', { session: false }),
  function(req, res) {
    fn.createJuiceShop({ herokuToken: HEROKU_TOKEN}, { url: 'https://rsa-ctf-provision.herokuapp.com/juiceshop.targz' }).then(ret => {
        res.json({ name: ret.name, id: ret.id, web_url: ret.web_url});
        res.end();
    }).catch(err => {
        res.sendStatus(500);
        res.end;
    });
  });
