var kue = require('kue');
var conf = {
    redis: {
        port: 6379,
        host: 'cl-redis.redis.cache.windows.net',
        auth: 'key',
        db: 3
    }
};
var jobs = kue.createQueue(conf);
jobs.process('email2', 1, function (job, done) {
    console.log(job.data.title);
    setTimeout(function () {
        try {
            //throw new Error('something bad happend');
            //console.log('email sent');
            done();
        }
        catch (e) {
            done(e);
        }
    }, 10000);
});
//# sourceMappingURL=consumer.js.map