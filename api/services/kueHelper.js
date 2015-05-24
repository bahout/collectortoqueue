/**
 * Created by nicolasbahout on 23/05/15.
 */
var Promise = require('bluebird');
var async = require('async');
module.exports = {
    updateAndSave: updateAndSave,
    countElementForModel: countElementForModel,
    produce: produce,
    removeAll: removeAll
};
function _queueProcess(col, comute, concurrency) {
    return new Promise(function (resolve, reject) {
        var saver = [];
        //creat a queue
        var q = async.queue(comute, concurrency);
        var count = 0;
        //add data to queue
        _(col).forEach(function (ele) {
            q.push(ele, function (err, data) {
                count++;
                saver.push(data);
                console.log('finished processing ' + count);
            });
        }).value();
        // assign a callback
        q.drain = function () {
            console.log('all items have been processed');
            //exit of queue Kue
            return resolve(saver);
        };
    });
}
function produce(modelName, kue_engine, options) {
    options.nowDate = new Date();
    return new Promise(function (resolve, reject) {
        return getLastTouch(modelName, options)
            .then(function (options) {
            return countElementForModel(modelName, options);
        })
            .then(function (options) {
            console.log('===>', options);
            return sendJobs(kue_engine, options);
        })
            .then(function (options) {
            console.log('===>', options);
            return saveLastTouch(modelName, options);
        })
            .then(resolve);
    });
}
function countElementForModel(modelName, options) {
    if (options === void 0) { options = {}; }
    return new Promise(function (resolve, reject) {
        console.log(modelName);
        var Model = sails.models[modelName.toLowerCase()];
        if (!options.condition)
            options.condition = {};
        if (options.touch) {
            options.condition[options.autoUpdateBaseOnField] = {
                '>': new Date(options.touch.lastTouch), '<': options.nowDate
            };
        }
        else {
            options.condition[options.autoUpdateBaseOnField] = {
                '>': new Date('2/4/2014'), '<': options.nowDate
            };
        }
        return Model
            .count(options.condition)
            .then(function (num, err) {
            options.count = num;
            if (!err)
                resolve(options);
            if (err)
                reject(err);
        }).catch(function (e) {
            console.log('count error', e);
            reject(err);
        });
    });
}
function getLastTouch(modelName, options) {
    return new Promise(function (resolve, reject) {
        console.log(modelName);
        return Collectortoqueue
            .findOne({ model: modelName })
            .then(function afterwards(updated, err) {
            console.log(err, updated);
            //if (_.isArray(updated)) updated = _.first(updated);
            options.touch = updated;
            if (!err)
                resolve(options);
            if (err)
                reject(err);
        });
    });
}
function saveLastTouch(modelName, options) {
    return new Promise(function (resolve, reject) {
        console.log(modelName);
        return Collectortoqueue
            .findOne({ model: modelName })
            .then(function (data) {
            console.log(data);
            if (data) {
                return Collectortoqueue
                    .update({ model: modelName }, {
                    lastTouch: new Date()
                });
            }
            else {
                return Collectortoqueue
                    .create({
                    model: modelName,
                    lastTouch: new Date()
                });
            }
        })
            .then(function afterwards(updated, err) {
            console.log(err, updated);
            //if (_.isArray(updated)) updated = _.first(updated);
            options.touch = updated;
            if (!err)
                resolve(options);
            if (err)
                reject(err);
        });
    });
}
function sendJobs(kue_engine, options) {
    return new Promise(function (resolve, reject) {
        var num = 0;
        var max = options.count;
        var sendJobConcurrency = 20;
        //if we used autoupdate we can't specify this
        if (!options.autoUpdateBaseOnField) {
            num = options.start || 0;
            max = options.max || options.count;
        }
        var step = options.step || 500;
        var arr = [];
        var condition = options.condition || {};
        var concurrency = options.concurrency || 1;
        var kueName = options.kueName || 'default';
        for (var i = num; i < max + 1; i = i + step) {
            arr.push({
                min: i,
                size: step - 1,
                condition: condition,
                concurrency: concurrency
            });
        }
        var q = async.queue(function (jobData, callback) {
            //console.log(jobData);
            kue_engine
                .create(kueName, jobData)
                .save(function (err) {
                //if (!err) console.log(jobData.id);
                callback();
            });
        }, sendJobConcurrency);
        // assign a callback
        q.drain = function () {
            console.log('all items have been processed');
            return resolve(options);
        };
        // add some items to the queue (batch-wise)
        q.push(arr, function (err) {
            sails.log.silly('finished processing 1 item');
        });
    });
}
function updateAndSave(modelFrom, modelTo, comute, options) {
    if (options === void 0) { options = {}; }
    return new Promise(function (resolve, reject) {
        var ModelFrom = sails.models[modelFrom.toLowerCase()];
        var ModelTo = sails.models[modelTo.toLowerCase()];
        return ModelFrom
            .find(options.condition || {})
            .limit(options.size || 50)
            .skip(options.min || 0)
            .then(function (col) {
            return _queueProcess(col, comute, options.concurrency || 1);
        })
            .then(function (col) {
            console.log('saved data 1');
            return ModelTo
                .findOrCreate({
                where: {
                    id: col.map(function (d) {
                        return d.id;
                    })
                }
            }, col)
                .then(function (data, err) {
                if (!err)
                    return resolve(data);
                if (err)
                    return reject(err);
            })
                .catch(function (err) {
                reject(err);
            });
        });
    });
}
/**
 * Used to remove task from kue for a type
 * @param type
 * @param status
 */
function removeAll(type, kue_engine, status) {
    if (status === void 0) { status = 'inactive'; }
    console.log('start remove jobs ', type, ' ', status);
    kue_engine.Job.rangeByType(type, status, 0, 1000000, 'asc', function (err, selectedJobs) {
        console.log(err, selectedJobs);
        selectedJobs.forEach(function (job) {
            //console.log(job);
            job.remove();
        });
    });
}
//# sourceMappingURL=kueHelper.js.map