/**
 * Created by nicolasbahout on 26/04/15.
 */
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Promise = require('bluebird');
var async = require('async');
var JobMaster_1 = require('./JobMaster');
var kue = require('kue');
/**
 * Kue has to have 2 methodes
 * 1) getMessages in order to get new data
 * Messages are stored in Kue.messages Array
 * 2) kue.deleteMessage(oneMessage) in Order
 */
var JobKue = (function (_super) {
    __extends(JobKue, _super);
    //messages
    /**
     *
     * @param getDataMaster
     * @param GetDataMaster
     * @param {concurrency} Nb job done in parallele
     */
    function JobKue(redisconf, collector) {
        _super.call(this, collector);
        this.concurrency = 2;
        this.type = 'url';
        this.removeOnComplete = true;
        this.queue = kue.createQueue({ redis: redisconf, disableSearch: true });
        this.queue.watchStuckJobs();
        this.name = 'JobKue';
        //this.resolveStuckjob();
        this.end();
    }
    JobKue.prototype.removeAll = function (type, status) {
        if (status === void 0) { status = 'inactive'; }
        console.log('start remove jobs ', type, ' ', status);
        kue.Job.rangeByType(type, status, 0, 1000000, 'asc', function (err, selectedJobs) {
            console.log(err, selectedJobs);
            selectedJobs.forEach(function (job) {
                //console.log(job);
                job.remove();
            });
        });
    };
    /**
     * Send Task
     * @param data
     */
    JobKue.prototype.task = function (data, type) {
        var _this = this;
        if (type === void 0) { type = this.type; }
        return new Promise(function (resolve, reject) {
            console.log('Send Task  ==>', data);
            data = _this.dataTransform(data)
                .then(function (data) {
                return _this.queue.create(_this.type, data)
                    .attempts(2)
                    .save(function (err) {
                    if (!err) {
                        //console.log(job.id);
                        resolve();
                    }
                });
            });
        });
    };
    /**
     * Get Task and Executte
     * @param type
     */
    JobKue.prototype.execTask = function (type) {
        var _this = this;
        console.log('startprocess execTask', type, this.concurrency);
        var count = 0;
        return new Promise(function (resolve, reject) {
            console.log('concurrency ==', _this.concurrency);
            _this.queue.process(type, _this.concurrency, function (job, done) {
                console.log('start process =', job.data);
                _this.unitTask(job.data)
                    .then(function () {
                    count++;
                    done();
                    if (count == _this.concurrency)
                        resolve();
                    // done();
                    //return resolve()
                }).catch(function (e) {
                    count++;
                    console.log('error in task', e);
                    done(new Error('error in task'));
                    if (count == _this.concurrency)
                        resolve();
                    //done(new Error('error in task' + e));
                    // done(new Error('error in task'));
                    //return resolve()
                });
            });
            //resolve()
        });
    };
    /*
     execTask(type) {
     //console.log('start process');
     return new Promise((resolve, reject)=> {
     //console.log('start process 2', this.queue);
     this.queue.process(type, this.concurrency, (job, done) => {
     //console.log('start process 3', job.data);

     this.unitTask(job.data)
     .then(()=> {
     done();
     return resolve()
     }).catch((e)=> {
     console.log('error in task', e);
     done(new Error('error in task' + e));
     return resolve()
     })
     });
     resolve()
     })

     }
     */
    /*
     unitTask(job) {
     return new Promise((resolve, reject)=> {
     resolve();
     })
     }
     */
    JobKue.prototype.end = function () {
        var _this = this;
        console.log('spy event uncaughtException and SIGTERM');
        process.on('uncaughtException', function (err) {
            console.log('uncaught exception', err.stack);
            _this.die();
            _this.dying = true;
        });
        process.on('SIGTERM', function () {
            console.log('SIGTERM');
            _this.die();
            _this.dying = true;
        });
    };
    JobKue.prototype.die = function () {
        console.log('in die');
        if (!this.dying) {
            this.queue.shutdown(function (err) {
                if (err) {
                    console.error('Kue DID NOT shutdown gracefully', err);
                }
                else {
                    console.info('Kue DID shutdown gracefully');
                }
                process.exit(1);
            });
        }
    };
    JobKue.prototype.resolveStuckjob = function (interval, maxTimeToExecute) {
        var _this = this;
        if (interval === void 0) { interval = 5000; }
        if (maxTimeToExecute === void 0) { maxTimeToExecute = 120000; }
        setInterval(function () {
            // first check the active job list (hopefully this is relatively small and cheap)
            // if this takes longer than a single "interval" then we should consider using
            // setTimeouts
            _this.queue.active(function (err, ids) {
                // for each id we're going to see how long ago the job was last "updated"
                async.map(ids, function (id, cb) {
                    // we get the job info from redis
                    kue.Job.get(id, function (err, job) {
                        if (err) {
                            throw err;
                        } // let's think about what makes sense here
                        // we compare the updated_at to current time.
                        var lastUpdate = +Date.now() - job.updated_at;
                        if (lastUpdate > maxTimeToExecute) {
                            console.log('job ' + job.id + ' hasnt been updated in ' + lastUpdate);
                            console.log(job);
                            var data = job.data.data;
                            delete job.data.data;
                            job.data = data;
                            _this.task(job).then(function () {
                                console.log('job.id', job.id);
                                return 'done';
                            }); // either reschedule (re-attempt?) or remove the job.
                            job.remove(function (err) {
                            });
                        }
                        else {
                            cb(null);
                        }
                    });
                });
            });
        }, interval);
    };
    return JobKue;
})(JobMaster_1.JobMaster);
exports.JobKue = JobKue;
//# sourceMappingURL=JobKue.js.map