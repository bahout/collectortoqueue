/**
 * Created by nicolasbahout on 23/05/15.
 */
var Promise = require('bluebird');
var async = require('async');
var kue = require('kue');
module.exports = {
    updateAndSave: updateAndSave,
    countElementForModel: countElementForModel,
    produce: produce,
    removeAll: removeAll,
    resolveStuckjob: resolveStuckjob
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
                sails.log.silly('finished processing ' + count);
            });
        }).value();
        // assign a callback
        q.drain = function () {
            console.log('all task from queue have been processed');
            //exit of queue Kue
            return resolve(saver);
        };
    });
}
function produce(kue_engine, options) {
    var modelName = options.model;
    options.nowDate = new Date();
    return new Promise(function (resolve, reject) {
        return getLastTouch(options)
            .then(function (options) {
            return countElementForModel(modelName, options);
        })
            .then(function (options) {
            console.log('===>', options);
            return sendJobs(kue_engine, options);
        })
            .then(function (options) {
            console.log('===>', options);
            return saveLastTouch(options);
        })
            .then(resolve);
    });
}
function countElementForModel(modelName, options) {
    if (options === void 0) { options = {}; }
    return new Promise(function (resolve, reject) {
        var Model = sails.models[modelName.toLowerCase()];
        if (!options.condition)
            options.condition = {};
        if (options.touch) {
            options.condition[options.autoUpdateBaseOnField] = {
                '>=': new Date(options.touch.lastTouch), '<': options.nowDate
            };
        }
        else {
            options.condition[options.autoUpdateBaseOnField] = {
                '<': options.nowDate
            };
        }
        return Model
            .count(options.condition)
            .then(function (num, err) {
            options.count = num;
            console.log('count result for ' + modelName, options.name, num);
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
function getLastTouch(options) {
    return new Promise(function (resolve, reject) {
        console.log('getLastTouch ==>', options.name);
        return Collectortoqueue
            .findOne({ model: options.name })
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
function saveLastTouch(options) {
    return new Promise(function (resolve, reject) {
        console.log("saveLastTouch ===>", options.name);
        return Collectortoqueue
            .findOne({ model: options.name })
            .then(function (data) {
            console.log(data);
            if (data) {
                return Collectortoqueue
                    .update({ model: options.name }, {
                    lastTouch: new Date()
                });
            }
            else {
                return Collectortoqueue
                    .create({
                    model: options.name,
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
        if (options.count == 0) {
            console.log('no job to add');
            return resolve(options);
        }
        //if we used autoupdate we can't specify this
        if (!options.autoUpdateBaseOnField) {
            num = options.start || 0;
            max = options.max || options.count;
        }
        var step = options.step || 500;
        var arr = [];
        var condition = options.condition || {};
        var concurrency = options.concurrency || 1;
        var kueName = options.name || 'default';
        if (options.key)
            var key = options.key;
        for (var i = num; i < max + 1; i = i + step) {
            var items = {
                min: i,
                size: step - 1,
                condition: condition,
                concurrency: concurrency,
            };
            if (key)
                items['key'] = key;
            arr.push(items);
        }
        var q = async.queue(function (jobData, callback) {
            //console.log(jobData);
            createJobInKue(kue_engine, kueName, jobData, callback);
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
        var key = options.key || 'id';
        var ModelFrom = sails.models[modelFrom.toLowerCase()];
        var ModelTo = sails.models[modelTo.toLowerCase()];
        /*
         console.log('modelFrom ', modelFrom, sails.models[modelFrom.toLowerCase()]);
         console.log('modelTo ', modelTo, sails.models[modelTo.toLowerCase()]);
         console.log('sails.models ', sails.models);
         sails.log.info(options.condition)
         */
        sails.log.silly('we start to get data from ', modelFrom.toLowerCase());
        return ModelFrom
            .find(options.condition || {})
            .limit(options.size || 50)
            .skip(options.min || 0)
            .then(function (col) {
            sails.log.silly('we successed to have data ', col);
            if (col.length == 0)
                return resolve();
            if (col.length > 0)
                return _queueProcess(col, comute, options.concurrency || 1);
        })
            .then(function (col) {
            col = _(col)
                .flatten()
                .compact()
                .uniq()
                .value();
            console.log('data to save ==>', col);
            if (col.length == 0) {
                console.log('nothing to save');
                return resolve();
            }
            if (ModelTo.adapterDictionary.mongo) {
                var where = {};
                where[key] = col.map(function (d) {
                    //console.log(key)
                    return d[key];
                });
            }
            else {
                var where = [];
                where = col.map(function (d) {
                    var tmp = {};
                    tmp[key] = d[key];
                    return tmp;
                });
            }
            console.log('where ==>', where);
            //console.log(where[key])
            //console.log(ModelTo)
            //console.log(ModelTo.adapterDictionary.mongo);
            return ModelTo
                .findOrCreate(where, col)
                .then(function (data, err) {
                console.log('data saved', data, err);
                if (!err)
                    return resolve(data);
                if (err)
                    return reject(err);
            })
                .catch(function (err) {
                sails.log.error('error during update', err);
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
/**
 * If a job is in active mode for more than one hour (interval), it is considered as dead job
 * ==> we delete it and add it in active queue again
 * @param interval
 * @param maxTimeToExecute
 */
function resolveStuckjob(kue_engine, interval, maxTimeToExecute) {
    if (interval === void 0) { interval = 60000; }
    if (maxTimeToExecute === void 0) { maxTimeToExecute = 6000000; }
    setInterval(function () {
        // first check the active job list (hopefully this is relatively small and cheap)
        // if this takes longer than a single "interval" then we should consider using
        // setTimeouts
        kue_engine.active(function (err, ids) {
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
                        console.log('================> ', job.data, job.type);
                        //TODO to remove comment
                        createJobInKue(kue_engine, job.type, job.data, function () {
                            console.log('job stuck recreated done done');
                        });
                        // either reschedule (re-attempt?) or remove the job.
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
}
;
/**
 * Kue Wrapper for create a job
 * @param kue_engine
 * @param kueName
 * @param jobData
 * @param callback
 */
var createJobInKue = function (kue_engine, kueName, jobData, callback) {
    kue_engine
        .create(kueName, jobData)
        .save(function (err) {
        //if (!err) console.log(jobData.id);
        callback();
    });
};
//# sourceMappingURL=kueHelper.js.map