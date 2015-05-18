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
        this.concurrency = 20;
        this.name = 'JobMaster';
        this.type = 'default';
        //this.collector = collector;
    }
    JobMaster.prototype.produce = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this
                .init()
                .then(function () {
                return _this.collector.countElement();
            })
                .then(function () {
                //console.log(this.collector);
                return console.log('this.collector.nbElements ', _this.collector.nbElements);
            })
                .then(_this.exec())
                .then(function () {
                resolve();
            })
                .catch(function (e) {
                reject(e);
            });
        });
    };
    JobMaster.prototype.init = function (type) {
        var _this = this;
        if (type === void 0) { type = this.type; }
        this.type = type;
        return new Promise(function (resolve, reject) {
            _this.collector.init()
                .then(function () {
                console.log('init.done');
                resolve();
            });
        });
    };
    JobMaster.prototype.unitTask = function (job) {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    };
    JobMaster.prototype.exec = function () {
        var _this = this;
        return function () {
            return new Promise(function (resolve, reject) {
                //console.log('this.name, this.collector.name', this.name, this.collector.name, this.collector.data);
                var date = new Date();
                var q = async.queue(function (task, callback) {
                    _this.addTask(task, callback);
                }, _this.concurrency);
                for (var i = _this.collector.start; i < _this.collector.nbElements; i = i + _this.collector.size) {
                    var data = { min: i, size: _this.collector.size, condition: _this.collector.filter };
                    //add tasks
                    //console.log('JobMaster.kue', JobMaster.kue.messages);
                    q.push(data, function (err) {
                        console.log('finished processing item');
                    });
                }
                // assign a callback
                q.drain = function () {
                    console.log('all task have been add in ', new Date() - date);
                    resolve('done');
                };
            });
        };
    };
    JobMaster.prototype.consume = function (type) {
    };
    JobMaster.prototype.addTask = function (job, cb) {
        this.task(job)
            .then(this.collector.deleteOneData(job))
            .then(function () {
            cb();
        });
    };
    JobMaster.prototype.dataTransform = function (data) {
        return new Promise(function (resolve, reject) {
            return resolve(data);
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