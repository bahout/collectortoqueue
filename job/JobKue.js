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
        this.queue = kue.createQueue({ redis: redisconf });
        this.name = 'JobKue';
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
    JobKue.prototype.dataTransform = function (data) {
        return new Promise(function (resolve, reject) {
            return resolve(data);
        });
    };
    JobKue.prototype.task = function (data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            data = _this.dataTransform(data)
                .then(function (data) {
                return _this.queue.create(_this.type, data)
                    .attempts(5)
                    .removeOnComplete(_this.removeOnComplete)
                    .save(function (err) {
                    if (!err) {
                        //console.log(job.id);
                        resolve();
                    }
                });
            });
        });
    };
    JobKue.prototype.execTask = function (type) {
        var _this = this;
        //console.log('start process');
        return new Promise(function (resolve, reject) {
            //console.log('start process 2', this.queue);
            _this.queue.process(type, _this.concurrency, function (job, done) {
                //console.log('start process 3', job.data);
                _this.unitTask(job.data)
                    .then(function () {
                    return done();
                })
                    .then(function () {
                    return resolve();
                });
            });
            resolve();
        });
    };
    JobKue.prototype.unitTask = function (job) {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    };
    return JobKue;
})(JobMaster_1.JobMaster);
exports.JobKue = JobKue;
//# sourceMappingURL=JobKue.js.map