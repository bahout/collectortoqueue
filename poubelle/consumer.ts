import kue = require('kue');
var conf = {
    redis: {
        port: 6379,
        host: 'cl-redis.redis.cache.windows.net',
        auth: 'ioYHOKAZb2UsTMzxCeYiGKDEiEkNLZ80y9nEtlQWPcM=',
        db: 3
        // auth_pass: 'ioYHOKAZb2UsTMzxCeYiGKDEiEkNLZ80y9nEtlQWPcM='
    }
};
var jobs = kue.createQueue(conf);

jobs.process('email2', 1, function (job, done) {
    console.log(job.data.title);
    setTimeout(function () {
        try {
            //throw new Error('something bad happend');
            //console.log('email sent');
            done()
        }
        catch (e) {
            done(e)
        }
    }, 10000)
});