import kue = require('kue');
var conf = {
    redis: {
        port: 6379,
        host: 'cl-redis.redis.cache.windows.net',
        auth: 'key',
        db: 3
        // auth_pass: 'ioYHOKAZb2UsTMzxCeYiGKDEiEkNLZ80y9nEtlQWPcM='
    }
};
var queue = kue.createQueue(conf);
var sequence = 0;

for (var i = 0; i < 10; i++) {
    (function (sequence) {
        var job = queue.create('email2', {
            title: 'welcome email for tj' + sequence
            , to: 'tj@learnboost.com'
            , template: 'welcome-email'
        })
            .attempts(5)
            //.priority(5)
            //.delay(5)
            .save(function (err) {
                if (!err) console.log(job.id);
            });

        job.on('complete', function () {
            console.log('job ' + sequence + ' completed')
        });

        job.on('failed', function () {
            console.log('job ' + sequence + 'failed')
        });

    })(i)

}


/*
 process.once('SIGTERM', function (sig) {
 queue.shutdown(5000, function (err) {
 console.log('Kue shutdown: ', err || '');
 process.exit(0);
 });
 });*/
