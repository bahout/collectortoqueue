var kue = require('kue');
var conf = {
    redis: {
        port: 6379,
        host: 'cl-redis.redis.cache.windows.net',
        auth: 'ioYHOKAZb2UsTMzxCeYiGKDEiEkNLZ80y9nEtlQWPcM=',
        db: 3
    }
};
var queue = kue.createQueue(conf);
var sequence = 0;
for (var i = 0; i < 10; i++) {
    (function (sequence) {
        var job = queue.create('email2', {
            title: 'welcome email for tj' + sequence,
            to: 'tj@learnboost.com',
            template: 'welcome-email'
        })
            .attempts(5)
            .save(function (err) {
            if (!err)
                console.log(job.id);
        });
        job.on('complete', function () {
            console.log('job ' + sequence + ' completed');
        });
        job.on('failed', function () {
            console.log('job ' + sequence + 'failed');
        });
    })(i);
}
/*
 process.once('SIGTERM', function (sig) {
 queue.shutdown(5000, function (err) {
 console.log('Kue shutdown: ', err || '');
 process.exit(0);
 });
 });*/
//# sourceMappingURL=producer.js.map