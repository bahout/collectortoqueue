/**
 * Created by nicolasbahout on 22/05/15.
 */

// config/kue.js

var kue = require('kue')
    , app = require('../app');

var conf = app.myConf;

var kue_engine = kue.createQueue({
    redis: conf.redis, disableSearch: true
});

process.once('SIGTERM', function (sig) {
    kue_engine.shutdown(function (err) {
        console.log('Kue is shut down.', err || '');
        process.exit(0);
    }, 5000);
});

module.exports.kue = kue_engine;