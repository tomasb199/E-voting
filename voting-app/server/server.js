const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');

const app = express();

//Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routes
app.use('/', require('./routes/routes'));

var port = normalizePort(process.env.PORT || '8000');
app.set('port', port);

const server = http.createServer(app);

const GooglePlusTokenStrategy = require('passport-google-plus-token');
const passport = require('passport');

function normalizePort(val) {
    var port = parseInt(val, 10);
  
    if (isNaN(port)) {
      // named pipe
      return val;
    }
  
    if (port >= 0) {
      // port number
      return port;
    }
  
    return false;
  }

expressServerUtils = require('express-server-utils')(server, port);
expressServerUtils.listen();
expressServerUtils.handleOnError();
expressServerUtils.handleOnListening();
  
const exitActions = [server.close];
expressServerUtils.handleShutDown(exitActions);