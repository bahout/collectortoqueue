/**
 * Created by nicolasbahout on 23/05/15.
 */
var Promise = require('bluebird');
var async = require('async');
var kue = require('kue');
var myOptions = require('../../consumer').myOptions;
module.exports = {
    updateAndSave: updateAndSave,
    produce: produce,
    removeAll: removeAll,
    resolveStuckjob: resolveStuckjob,
    resolveFailedjob: resolveFailedjob
};
/**
 * Used by the consummer
 * @param col
 * @param comute
 * @param concurrency : nb job add in kue in save time
 * @private
 */
function _queueProcess(col, comute, concurrency) {
    return new Promise(function (resolve, reject) {
        var saver = [];
        console.log('create a queue');
        var q = async.queue(comute, concurrency);
        var count = 0;
        //add data to queue
        _(col).forEach(function (ele) {
            q.push(ele, function (err, data) {
                //we get here after data has been process and is ready to be saved
                //sails.log('data element =>', data);
                count++;
                saver.push(data);
                //sails.log.silly('finished processing ' + count);
            });
        }).value();
        // assign a callback
        q.drain = function () {
            //console.log('all task from queue have been processed');
            //sails.log('saver ==>', saver);
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
            console.log('===>', options.name, options.count);
            return sendJobs(kue_engine, options);
        })
            .then(function (options) {
            //console.log('===>', options);
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
        //todo it is actually only for a date
        if (options.autoUpdateBaseOnField) {
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
        }
        if (options.touch && options.onlyOnce == true) {
            //job has already add to kue in previous startup
            //we add a silly condition witch never happens
            //todo to improve
            options.condition['onlyOnce123'] = true;
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
            reject(e);
        });
    });
}
function getLastTouch(options) {
    return new Promise(function (resolve, reject) {
        //console.log('getLastTouch ==>', options.name);
        return Collectortoqueue
            .findOne({ model: options.name })
            .then(function afterwards(updated, err) {
            //console.log(err, updated);
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
        //console.log("saveLastTouch ===>", options.name);
        return Collectortoqueue
            .findOne({ model: options.name })
            .then(function (data) {
            //console.log(data);
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
            //console.log(err, updated);
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
        console.log('job to add ', options.count);
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
        for (var i = num; i < max + 1; i = i + step) {
            var items = {
                min: i,
                size: step - 1,
                condition: condition
            };
            arr.push(items);
        }
        var q = async.queue(function (jobData, callback) {
            //console.log(jobData);
            createJobInKue(kue_engine, kueName, jobData, options, callback);
        }, sendJobConcurrency);
        // assign a callback
        q.drain = function () {
            console.log('all items have been processed');
            return resolve(options);
        };
        // add some items to the queue (batch-wise)
        q.push(arr, function (err, ele) {
            sails.log.silly('finished processing 1 item', err, ele);
        });
    });
}
/**
 * Update Date or Save
 * @param modelFrom
 * @param modelTo
 * @param comute
 * @param kueInfo
 */
//todo to simplify
function updateAndSave(modelFrom, modelTo, comute, kueInfo) {
    var kueData = kueInfo.data; // get data save in Kue
    var option = myOptions[kueInfo.type]; //get producer info
    return new Promise(function (resolve, reject) {
        var key = option.key || 'id';
        var ModelFrom = sails.models[modelFrom.toLowerCase()];
        var ModelTo = sails.models[modelTo.toLowerCase()];
        sails.log.silly('we start to get data from ', modelFrom.toLowerCase(), option.condition);
        return ModelFrom
            .find(option.condition || {})
            .limit(kueData.size || 50)
            .skip(kueData.min || 0)
            .then(function (findDataToConsumme) {
            sails.log.silly('we successed to have data with concurrency', findDataToConsumme, option.dataToCommuteInSameTime);
            if (findDataToConsumme.length == 0)
                return resolve();
            if (findDataToConsumme.length > 0)
                return _queueProcess(findDataToConsumme, comute, option.dataToCommuteInSameTime || 1);
        })
            .then(function (col) {
            // kueInfo.log('final data to update' + JSON.stringify(col));
            sails.log('final data to update' + JSON.stringify(col));
            //todo maybe uniq(key) should be an option
            col = _(col)
                .flatten()
                .compact()
                .uniq(key)
                .value();
            if (col.length == 0) {
                console.log('nothing to save');
                return resolve();
            }
            var idsToSave = _(col).pluck(key).value();
            sails.log.silly('idsToSave ==>', idsToSave);
            var tps1 = new Date();
            sails.log.silly('we will saved data in new table', tps1);
            var whereKeysTofind = {};
            whereKeysTofind[key] = idsToSave; //{key:[id1,id2,...]
            return ModelTo
                .find(whereKeysTofind)
                .then(function (data, err) {
                //sails.log.silly('ids founds ?', data);
                var idsFinds = _(data).pluck(key).value();
                console.log('idsFinds ==>', idsDifference);
                console.log('idsFinds ==>', idsFinds);
                var idsDifference = _.difference(idsToSave, idsFinds);
                var idsIntersection = _.intersection(idsToSave, idsFinds);
                console.log('idsIntersection ==>', idsIntersection);
                console.log('idsDifference ==>', idsDifference);
                //kueInfo.log('the really final data to update' + JSON.stringify(col));
                sails.log.silly('the really final data to update' + JSON.stringify(col));
                // sails.log.silly('nothing to save or update', option.method, idsIntersection.length, idsDifference.length);
                if (idsDifference.length > 0
                    && (option.method == undefined || option.method == 'findOrCreate')) {
                    //sails.log.silly('we will save data', col);
                    return _createRowsInDb(col);
                }
                else if (idsIntersection.length > 0
                    && (option.method == 'findAndUpdate')) {
                    //sails.log.silly('we will update data', col);
                    return _updateRowsInDb(col);
                }
                else {
                    sails.log.silly('==> nothing to create or update');
                    return resolve();
                }
                /////////private method++//////////
                function _createRowsInDb(col) {
                    //sails.log.silly('data to create', col);
                    // sails.log(idsIntersection, key);
                    var dataToSave = _(col).map(function (ele) {
                        //we want to save data not include in intersection: it is new data
                        if (idsIntersection.indexOf(ele[key]) == -1) {
                            return ele;
                        }
                    })
                        .compact()
                        .uniq()
                        .value();
                    //sails.log.silly('data to Create want to creat', dataToSave);
                    return ModelTo.create(dataToSave).exec(function (err, data) {
                        sails.log.silly('final data update in data base !!!');
                        //if (options.method == 'update') return ModelTo.create(dataToSave)
                    });
                    //if (options.method == 'update') return ModelTo.create(dataToSave)
                }
                ;
                function _updateRowsInDb(col) {
                    var dataToSave = _(col).map(function (ele) {
                        if (idsDifference.indexOf(ele[key]) != -1) {
                            return ele;
                        }
                    })
                        .compact()
                        .uniq()
                        .value();
                    //with map order is not guaranteed ==> we have to re-create key Array to guaranteed order
                    var idsToUpdate = [];
                    var dataToSave = _(dataToSave).map(function (ele) {
                        var tmp = {};
                        tmp[key] = ele[key];
                        idsToUpdate.push(tmp);
                        return ele;
                    }).value();
                    // sails.log.silly('data to Create want to create', dataToSave);
                    //todo Maybe update
                    return ModelTo.update(idsToUpdate, dataToSave)
                        .exec(function (err, data) {
                        sails.log.silly('final data update in data base !!!');
                        //if (options.method == 'update') return ModelTo.create(dataToSave)
                    });
                    //if (options.method == 'update') return ModelTo.create(dataToSave)
                }
                ;
                /////////////////   END OF PRIVATE METHOD //////////////////////
            })
                .then(function (data, err) {
                //sails.log.silly('data saved ', new Date() - tps1, data, err);
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
function resolveFailedjob(kue_engine, interval, maxTimeToExecute) {
    if (interval === void 0) { interval = 60000; }
    if (maxTimeToExecute === void 0) { maxTimeToExecute = 600000; }
    setInterval(function () {
        // first check the active job list (hopefully this is relatively small and cheap)
        // if this takes longer than a single "interval" then we should consider using
        // setTimeouts
        kue_engine.failed(function (err, ids) {
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
                        createJobInKue(kue_engine, job.type, job.data, {}, function () {
                            sails.log.info(new Date(), "failed job recreated ", job.type, job.data, job.id);
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
                        //sails.log.silly('job ' + job.id + ' hasnt been updated in ' + lastUpdate);
                        //sails.log.silly('================> ', job.data, job.type);
                        //TODO to remove comment
                        createJobInKue(kue_engine, job.type, job.data, {}, function () {
                            sails.log.silly('job stuck recreated done done', job.type, job.data);
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
var createJobInKue = function (kue_engine, kueName, jobData, options, callback) {
    kue_engine
        .create(kueName, jobData)
        .attempts(options.attempts || 2)
        .priority(options.priority || 'low')
        .save(function (err) {
        //if (!err) console.log(jobData.id);
        callback();
    });
};
//# sourceMappingURL=kueHelper.js.map