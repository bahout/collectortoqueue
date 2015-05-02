/**
 * Created by nicolasbahout on 26/04/15.
 */
var Promise = require('bluebird');
var async = require('async');
/**
 * Kue has to have 2 methodes
 * 1) getMessages in order to get new data
 * Messages are stored in Kue.messages Array
 * 2) kue.deleteMessage(oneMessage) in Order
 */
var JobMaster = (function () {
    //messages
    /**
     *
     * @param getDataMaster
     * @param GetDataMaster
     * @param {concurrency} Nb job done in parallele
     */
    function JobMaster(collector) {
        this.collector = collector;
        this.concurrency = 2;
        this.name = 'JobMaster';
        //this.collector = collector;
    }
    JobMaster.prototype.init = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.collector.init()
                .then(function () {
                console.log('init.done');
                resolve();
            });
        });
    };
    JobMaster.prototype.exec = function () {
        var _this = this;
        this.collector.concurrency = this.concurrency;
        return function () {
            return new Promise(function (resolve, reject) {
                var executeAlljobs = function () {
                    //console.log('this.name, this.collector.name', this.name, this.collector.name, this.collector.data);
                    _this._exec(_this.collector.data)
                        .then(_this.collector.getData())
                        .then(function () {
                        console.log('JobMaster.GetDataMaster.data.length', _this.collector.data.length);
                        if (_this.collector.data == 0) {
                            console.log('we try to resolve');
                            return resolve();
                        }
                        executeAlljobs();
                    });
                };
                console.log('this.name, this.collector.name)', _this.name, _this.collector.name, _this.collector.data);
                return executeAlljobs();
            });
        };
    };
    JobMaster.prototype._exec = function (data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            //queue for task
            var q = async.queue(function (task, callback) {
                _this.execUnit(task, callback);
            }, _this.concurrency);
            //add tasks
            //console.log('JobMaster.kue', JobMaster.kue.messages);
            q.push(data, function (err) {
                //console.log('finished processing item');
            });
            // assign a callback
            q.drain = function () {
                console.log('all items have been processed');
                resolve('done');
            };
        });
    };
    JobMaster.prototype.execUnit = function (job, cb) {
        this.task(job)
            .then(this.collector.deleteOneData(job))
            .then(function () {
            cb();
        });
    };
    JobMaster.prototype.task = function (job) {
        return new Promise(function (resolve, reject) {
            console.log('commute job', job);
            resolve();
        });
    };
    JobMaster.prototype.send = function (job) {
        this.task(job);
    };
    return JobMaster;
})();
exports.JobMaster = JobMaster;
//# sourceMappingURL=JobMaster.js.map