/**
 * Created by nicolasbahout on 22/05/15.
 */
// worker.js
var _ = require('lodash'), kue = require('kue'), q = require('q'), path = require('path'), sails = require('sails');
var app = require('./app');
var CronJob = require('cron').CronJob;
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
        }
        catch (e) {
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
        }
        catch (e0) {
            try {
                rc = require('sails/node_modules/rc');
            }
            catch (e1) {
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
            localDir = __dirname + path.sep + '..' + path.sep;
        }
        else {
            localDir = __dirname + path.sep + '..' + path.sep + '..' + path.sep;
        }
        sails.load({
            paths: {
                models: localDir + conf.directory.models
            },
            log: { level: 'silly' },
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
            sails.log.info("Starting kue for producers");
            var kue_engine = sails.config.kue;
            //register kue.
            sails.log.info("Registering jobs ", localDir + conf.directory.producers);
            //add producers en kue.........
            var producers = require('include-all')({
                dirname: localDir + conf.directory.producers,
                filter: /(.+)\.js$/,
                excludeDirs: /^\.(git|svn)$/,
                optional: true
            });
            //sails.log.info("producers list ", producers);
            var sendProducerToKue = function (options, name) {
                kueHelper
                    .produce(kue_engine, options)
                    .then(function () {
                    //console.log(name + ' produce done')
                });
                //sails.log.info("Registering kue producer: " + name);
            };
            _.forEach(producers, function (options, name) {
                //console.log('function producer==>', options);
                if (!options.name)
                    options.name = name;
                //todo to test
                if (options.cron)
                    new CronJob(options.cron, function () {
                        sendProducerToKue(options, name);
                    }, null, true, 'America/Los_Angeles');
                if (options.sendProducerAtStartup != false)
                    sendProducerToKue(options, name);
            });
            //producers kue ....
            kue_engine.on('job complete', function (id) {
                kue.Job.get(id, function (err, job) {
                    if (err) {
                        console.log(err);
                    }
                    if (job) {
                        sails.log.info(new Date(), " Removing completed job: ", job.type, job.data, job.id);
                        job.remove();
                    }
                });
            });
            // Resolve stuck jobs
            kueHelper.resolveStuckjob(kue_engine);
            kueHelper.resolveFailedjob(kue_engine);
            /*   kueHelper.removeAll('Getinfofromurl', kue, 'inactive');
             kueHelper.removeAll('Getinfofromurl', kue, 'complete');
             kueHelper.removeAll('Getinfofromurl', kue, 'active');
             kueHelper.removeAll('findwebsite', kue, 'inactive');
             kueHelper.removeAll('findwebsite', kue, 'active');
             kueHelper.removeAll('Findwebsite', kue, 'inactive');
             kueHelper.removeAll('Findwebsite', kue, 'active');
             kueHelper.removeAll('Findwebsite', kue, 'inactive');
             kueHelper.removeAll('Findwebsite', kue, 'complete');
             kueHelper.removeAll('findwebsite', kue, 'complete');


             */
            /*  kueHelper.removeAll('Users', kue, 'active');
             kueHelper.removeAll('Users', kue, 'inactive');
             kueHelper.removeAll('Users', kue, 'complete');
             kueHelper.removeAll('User', kue, 'active');
             kueHelper.removeAll('User', kue, 'inactive');
             kueHelper.removeAll('User', kue, 'complete');*/
            /* kueHelper.removeAll('Users2', kue, 'active');
             kueHelper.removeAll('Users2', kue, 'inactive');
             kueHelper.removeAll('Users2', kue, 'complete');*/
            /*    kueHelper.removeAll('Findwebsite2', kue, 'active');
             kueHelper.removeAll('Findwebsite2', kue, 'inactive');
             kueHelper.removeAll('Findwebsite2', kue, 'complete');
             */
            /*    kueHelper.removeAll('Findwebsite3', kue, 'active');
             kueHelper.removeAll('Findwebsite3', kue, 'inactive');
             kueHelper.removeAll('Findwebsite3', kue, 'complete');*/
            process.once('SIGTERM', function (sig) {
                kue_engine.shutdown(function (err) {
                    console.log('Kue is shut down.', err || '');
                    process.exit(0);
                }, 5000);
            });
        });
    })();
};
//# sourceMappingURL=producer.js.map