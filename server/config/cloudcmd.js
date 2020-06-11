const http = require('http');
const cloudcmd = require('cloudcmd');
const io = require('socket.io');
const express = require('express');
const passport = require('passport');
const url = require('url');
const appConfig = require('./config');

const config = {
    name: 'Online Experiments Assets Manager',
    root: appConfig.studyAssetsFolder,
    console: false,
    contact: false,
    configDialog: false,
    editor: "deepword",
};

const filePicker = {
    data: {
        FilePicker: {
            key: 'key',
        }
    }
};

// override option from json/modules.json
const modules = {
    filePicker,
};

const {
    createConfigManager,
    configPath,
} = cloudcmd;

const configManager = createConfigManager({
    configPath,
});


module.exports = function (prefix, app) {
    // TODO: get server as a parameter for this function
    const server = http.createServer(app);
    const socket1 = io.listen(server, {
        path: `${prefix}/socket.io`
    });

    const router = express.Router();
    router.use(function(req, res, next) {
        passport.authenticate('jwt', { session: false }, function(err, user, info) {
            if (err) { return next(err); }
            if (!user) {
                return res.redirect('/auth/login?redirect=' + req.originalUrl);
            }
            
            // no need to log in user - we are not keeping sessions
            // req.logIn(user, function(err) {
            //   if (err) { return next(err); }
            //   return next();
            // });

            return next();
        })(req, res, next);
    });
    router.use(cloudcmd({
        socket: socket1,  // used by Config, Edit (optional) and Console (required)
        config,  // config data (optional)
        modules, // optional
        configManager, // optional
    }));

    app.use(prefix, router);

    return server;
};