/**
 * Created by nicolasbahout on 22/05/15.
 */

// worker.js

var _ = require('lodash'),
    kue = require('kue'),
    q = require('q'),
    path = require('path'),
    sails = require('sails');
var app = require('./app');

var configData, localDir;

module.exports = function (conf) {

    //console.log(conf);
    console.log('start');

    module.exports.myConf = conf;

    process.chdir(__dirname);

// Ensure a "sails" can be located:
    (function () {
        var sails;
        try {
            sails = require('sails');
        } catch (e) {
            console.error('To run an app using `node app.js`, you usually need to have a version of `sails` installed in the same directory as your app.');
            console.error('To do that, run `npm install sails`');
            console.error('');
            console.error('Alternatively, if you have sails installed globally (i.e. you did `npm install -g sails`), you can use `sails lift`.');
            console.error('When you run `sails lift`, your app will still use a local `./node_modules/sails` dependency if it exists,');
            console.error('but if it doesn\'t, the app will run with the global sails instead!');
            return;
        }


        // Try to get `rc` dependency
        var rc;
        try {
            rc = require('rc');
        } catch (e0) {
            try {
                rc = require('sails/node_modules/rc');
            } catch (e1) {
                console.error('Could not find dependency: `rc`.');
                console.error('Your `.sailsrc` file(s) will be ignored.');
                console.error('To resolve this, run:');
                console.error('npm install rc --save');
                rc = function () {
                    return {};
                };
            }
        }

        if (__dirname.indexOf('node_modules') == -1) {
            localDir = __dirname + path.sep + '..' + path.sep
        } else {
            localDir = __dirname + path.sep + '..' + path.sep + '..' + path.sep
        }

        sails.load({
            paths: {
                models: localDir + conf.directory.models
            },
            log: {level: 'silly'},
            hooks: {
                blueprints: false,
                controllers: false,
                cors: false,
                csrf: false,
                grunt: false,
                //http: false,
                i18n: false,
                logger: false,
                policies: false,
                pubsub: false,
                //pubsub: require('pubsub-emitter'),
                request: false,
                responses: false,
                session: false,
                sockets: false,
                views: false
            }
        }, function (err, app) {

            sails.log.info("Starting kue");
            var kue_engine = sails.config.kue;

            //register kue.
            sails.log.info("Registering jobs ", localDir + conf.directory.jobs);


            //process .........
            var jobs = require('include-all')({
                dirname: localDir + conf.directory.jobs,
                filter: /(.+)\.js$/,
                excludeDirs: /^\.(git|svn)$/,
                optional: true
            });

            sails.log.info("jobs list ", jobs);

            _.forEach(jobs, function (job, name) {
                console.log(job);
                sails.log.info("Registering kue handler: " + name);
                kue_engine.process(name, job);
            });
            //process kue ....

            /* kue_engine.on('job complete', function (id) {
             sails.log.info("Removing completed job: " + id + ' ' + new Date());
             kue.Job.get(id, function (err, job) {
             if (err) {
             console.log(err)
             }
             if (job) job.remove();
             });
             });*/


            process.once('SIGTERM', function (sig) {
                kue_engine.shutdown(function (err) {
                    console.log('Kue is shut down.', err || '');
                    process.exit(0);
                }, 5000);
            });

        });
    })();
}

