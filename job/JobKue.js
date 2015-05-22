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
var _ = require('lodash');
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
    function JobKue(redisconf, collector, saver, type) {
        _super.call(this, collector);
        this.concurrency = 1;
        this.removeOnComplete = true;
        console.log('redisconf from constructor', redisconf);
        this.queue = kue.createQueue({ redis: redisconf, disableSearch: true });
        this.queue.watchStuckJobs();
        if (saver) {
            this.saver = saver;
        }
        this.name = 'JobKue';
        this.end();
    }
    JobKue.prototype.remove = function (type, status) {
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
    JobKue.prototype.task = function (data) {
        var _this = this;
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
     * Get Task and Execute
     * @param type
     */
    JobKue.prototype.consume = function (type) {
        var _this = this;
        console.log('startprocess execTask', type, this.concurrency);
        var count = 0;
        return new Promise(function (resolve, reject) {
            console.log('concurrency ==', _this.concurrency);
            _this.queue.process(type, _this.concurrency, function (job, done) {
                console.log('start process =', job.data);
                _this.collector.start = job.data.min;
                _this.collector.size = job.data.size;
                _this.collector.filter = job.data.condition;
                _this.saver
                    .init();
                _this.collector
                    .init()
                    .then(_this.collector.getData())
                    .then(function () {
                    console.log(_this.collector.data.length);
                    console.log('all data has been retrived from database (this.data)');
                    //done is to send when all data has be process
                    //creat a queue
                    var q = async.queue(_this.comute, _this.concurrency);
                    var count = 0;
                    //add data to queue
                    _(_this.collector.data).forEach(function (ele) {
                        q.push(ele, function (err, data) {
                            //console.log('data ==>', data);
                            count++;
                            _this.saver.data.push(data);
                            console.log('finished processing ' + count);
                        });
                    }).value();
                    // assign a callback
                    q.drain = function () {
                        console.log('all items have been processed');
                        //exit of queue Kue
                        _this.saver.insertDocuments(_this.saver.data).then(function () {
                            console.log('all items have been saved');
                            _this.saver.data = [];
                            done();
                            //exit of promises
                            resolve();
                        });
                    };
                });
                /* this.unitTask(job.data)
                 .then(()=> {
                 count++;
                 done();
                 if (count == this.concurrency) resolve();

                 // done();
                 //return resolve()
                 }).catch((e)=> {
                 count++;
                 console.log('error in task', e);
                 done(new Error('error in task'));
                 if (count == this.concurrency) resolve();

                 //done(new Error('error in task' + e));
                 // done(new Error('error in task'));
                 //return resolve()
                 })*/
            });
            //resolve()
        });
    };
    JobKue.prototype.commute = function (data, cb) {
    };
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
        if (maxTimeToExecute === void 0) { maxTimeToExecute = 6000000; }
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
                            console.log('================> ', job.data, _this.type);
                            _this.task(job.data).then(function () {
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