const http = require('http');
const cloudcmd = require('cloudcmd');
const io = require('socket.io');
const express = require('express');
const passport = require('passport');

const config = {
    name: 'cloudcmd :)',
    root: 'C:\\Development\\schonberg',
    console: false,
    contact: false,
    configDialog: false,
    editor: 'dword',
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
    router.use(passport.authenticate('jwt', { session: false }))
    router.use(cloudcmd({
        socket: socket1,  // used by Config, Edit (optional) and Console (required)
        config,  // config data (optional)
        modules, // optional
        configManager, // optional
    }));

    app.use(prefix, router);

    return server;
};