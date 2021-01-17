const path = require('path');
const http = require('http');
const express = require('express');
const httpError = require('http-errors');
const morgan = require('morgan');
const log4js = require('log4js');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const compress = require('compression');
const methodOverride = require('method-override');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const routes = require('../routes/index.route');
const customFiles = require('./custom.files');
const config = require('./config');
const passport = require('./passport');
const cloudcmd = require('./cloudcmd');
const session = require('./session');

const app = express();
const server = http.createServer(app);
const APP_PREFIX = config.appPrefix + "/";

log4js.configure({
  appenders: {
    everything: { type: 'dateFile', filename: 'logs/server.log', pattern: '.yyyy-MM-dd-hh', compress: false },
    data: { type: 'dateFile', filename: 'logs/data.log', compress: true }
  },
  categories: {
    default: { appenders: [ 'everything' ], level: 'debug' },
    data: { appenders: [ 'data' ], level: 'debug' }
  }
});
const logger = log4js.getLogger();

if (config.env === 'development') {
  console.log('running in dev mode');
  app.use(morgan('[:date[clf]] :method :url :status :response-time[0] ms / :total-time[0] ms - :res[content-length]', {
    stream: {
      write: function (str) { logger.debug(str); },
    },
    //skip: function (req, res) { return !req.url.includes('api') && !req.url.includes('session')}
  }));
  app.use(cors())
  app.use(APP_PREFIX + "test", express.static(path.resolve(__dirname, '../../..', 'piggy_app')));
}

// Choose what fronten framework to serve the dist from
var distDir = '../../dist/';
if (config.frontend == 'react'){
  distDir ='../../node_modules/material-dashboard-react/dist'
 }else{
  distDir ='../../dist/' ;
 }

app.use(APP_PREFIX, express.static(path.join(__dirname, distDir)))
app.use(APP_PREFIX + 'custom-file', customFiles(path.resolve(__dirname, '..', 'assets')));
app.use(APP_PREFIX + 'manifests', customFiles(path.resolve(config.studyAssetsFolder, 'manifests')));

app.use(/^((?!(api|study_assets|test)).)*/, (req, res) => {
  res.sendFile(path.join(__dirname, distDir + '/index.html'));
});

console.log('serving directory: ' + distDir);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser(config.jwtSecret));
app.use(compress());
app.use(methodOverride());

// secure apps by setting various HTTP headers
app.use(helmet());

// enable CORS - Cross Origin Resource Sharing
app.use(cors());

app.use(passport.initialize());

// Files browser
const filesBrowserRoute = APP_PREFIX + 'study_assets';
app.use(filesBrowserRoute, cloudcmd(filesBrowserRoute, server));

// configure web sockets
session(server);

app.use(APP_PREFIX + 'api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API router
app.use(APP_PREFIX + 'api/', routes);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new httpError(404)
  return next(err);
});

// error handler, send stacktrace only during development
app.use((err, req, res, next) => {
  // customize Joi validation errors
  if (err.isJoi) {
    err.message = err.details.map(e => e.message).join("; ");
    err.status = 400;
  }

  logger.error(err);

  if (config.env === 'development') {
    res.status(err.status || 500).json({
      message: err.message
    });
  } else {
    res.status(err.status || 500);
  }

  next(err);
});

module.exports = server;
