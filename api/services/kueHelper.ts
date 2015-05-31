/**
 * Created by nicolasbahout on 23/05/15.
 */
import  Promise = require('bluebird');
import async = require('async');
import kue = require('kue');
var myOptions = require('../../consumer').myOptions;


module.exports = {
    updateAndSave: updateAndSave,
    produce: produce,
    removeAll: removeAll,
    resolveStuckjob: resolveStuckjob,
    resolveFailedjob: resolveFailedjob
};


/**
 * Used by the producer
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
                    count++;
                    saver.push(data);
                    sails.log.silly('finished processing ' + count);
                }
            )
        }).value();

// assign a callback
        q.drain = function () {
            console.log('all task from queue have been processed');
            //exit of queue Kue
            return resolve(saver);

        }
    })
}

function produce(kue_engine, options) {

    var modelName = options.model;

    options.nowDate = new Date();
    return new Promise((resolve, reject)=> {
        return getLastTouch(options)
            .then(function (options) {
                return countElementForModel(modelName, options)
            })
            .then(function (options) {
                console.log('===>', options);
                return sendJobs(kue_engine, options)
            })
            .then(function (options) {
                console.log('===>', options);
                return saveLastTouch(options)
            })
            .then(resolve)
    })
}


function countElementForModel(modelName, options = {}) {

    return new Promise((resolve, reject)=> {
            var Model = sails.models[modelName.toLowerCase()];

            if (!options.condition) options.condition = {};

            //todo it is actually only for a date
            if (options.autoUpdateBaseOnField) {
                if (options.touch) {
                    options.condition[options.autoUpdateBaseOnField] = {
                        '>=': new Date(options.touch.lastTouch), '<': options.nowDate
                    }
                }
                else {
                    options.condition[options.autoUpdateBaseOnField] = {
                        '<': options.nowDate
                    }
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
                    if (!err) resolve(options);
                    if (err) reject(err)
                }).catch(function (e) {
                    console.log('count error', e);
                    reject(err);
                });
        }
    )

}


function getLastTouch(options) {
    return new Promise((resolve, reject)=> {
        console.log('getLastTouch ==>', options.name);
        return Collectortoqueue
            .findOne({model: options.name})
            .then(function afterwards(updated, err) {
                console.log(err, updated);
                //if (_.isArray(updated)) updated = _.first(updated);
                options.touch = updated;
                if (!err) resolve(options);
                if (err) reject(err);
            });

    })
}


function saveLastTouch(options) {
    return new Promise((resolve, reject)=> {
        console.log("saveLastTouch ===>", options.name);
        return Collectortoqueue
            .findOne({model: options.name})
            .then(function (data) {
                console.log(data);
                if (data) {
                    return Collectortoqueue
                        .update({model: options.name}, {
                            lastTouch: new Date()
                        })
                }
                else {
                    return Collectortoqueue
                        .create({
                            model: options.name,
                            lastTouch: new Date()
                        })
                }

            })
            .then(function afterwards(updated, err) {
                console.log(err, updated);
                //if (_.isArray(updated)) updated = _.first(updated);
                options.touch = updated;
                if (!err) resolve(options);
                if (err) reject(err);
            });

    })

}


function sendJobs(kue_engine, options) {
    return new Promise((resolve, reject)=> {

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
            return resolve(options)
        };


        // add some items to the queue (batch-wise)
        q.push(arr, function (err) {
            sails.log.silly('finished processing 1 item');
        });
    })

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

    return new Promise((resolve, reject)=> {

        var key = option.key || 'id';
        var ModelFrom = sails.models[modelFrom.toLowerCase()];
        var ModelTo = sails.models[modelTo.toLowerCase()];

        sails.log.silly('we start to get data from ', modelFrom.toLowerCase());

        return ModelFrom
            .find(kueData.condition || {})
            .limit(kueData.size || 50)
            .skip(kueData.min || 0)
            .then(function (col) {
                sails.log.silly('we successed to have data with concurrency', option.dataToCommuteInSameTime);
                if (col.length == 0) return resolve();
                if (col.length > 0) return _queueProcess(col, comute, option.dataToCommuteInSameTime || 1)
            })
            .then(function (col) {

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

                //sails.log.silly('idsToSave ==>', idsToSave);
                var tps1 = new Date();
                sails.log.silly('we will saved data in new table', tps1);

                var whereKeysTofind = {};
                whereKeysTofind[key] = idsToSave; //{key:[id1,id2,...]

                return ModelTo
                    //.create(col)
                    .find(whereKeysTofind)
                    .then(function (data, err) {
                        //sails.log.silly('ids founds ?', data);
                        var idsFinds = _(data).pluck(key).value();

                        var idsDifference = _.difference(idsToSave, idsFinds);
                        var idsIntersection = _.intersection(idsToSave, idsFinds);


                        sails.log.silly('nothing to save or update', option.method, idsIntersection.length, idsDifference.length);

                        if (idsDifference.length > 0
                            && (option.method == undefined || option.method == 'findOrCreate')) {
                            sails.log.silly('we will save data');

                            return _createRowsInDb();
                        }
                        else if (idsIntersection.length > 0
                            && (option.method == 'findAndUpdate')) {
                            sails.log.silly('we will update data');
                            return _updateRowsInDb();
                        }
                        else {
                            return resolve()
                        }


                        /////////private method++//////////
                        function _createRowsInDb() {
                            var dataToSave = _(col).map(function (ele) {
                                if (idsIntersection.indexOf(ele[key]) != -1) {
                                    return ele;
                                }
                            })
                                .compact()
                                .uniq()
                                .value();

                            sails.log.silly('data to Create want to update', dataToSave);
                            return ModelTo.create(dataToSave);
                            //if (options.method == 'update') return ModelTo.create(dataToSave)
                        };

                        function _updateRowsInDb() {
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
                                tmp[key] = ele[key]
                                idsToUpdate.push(tmp);
                                return ele;
                            }).value();


                            sails.log.silly('data to Create want to create', dataToSave);
                            //todo Maybe update
                            return ModelTo.update(idsToUpdate, dataToSave);
                            //if (options.method == 'update') return ModelTo.create(dataToSave)
                        };

                        /////////////////   END OF PRIVATE METHOD //////////////////////


                    })
                    //.create(col)
                    .then(function (data, err) {
                        sails.log.silly('data saved ', new Date() - tps1, data, err);
                        if (!err) return resolve(data);
                        if (err) return reject(err);
                    })
                    .catch(function (err) {
                        sails.log.error('error during update', err);
                        reject(err);
                    })


            })
    })

}


/**
 * Used to remove task from kue for a type
 * @param type
 * @param status
 */
function removeAll(type, kue_engine, status = 'inactive') {
    console.log('start remove jobs ', type, ' ', status);
    kue_engine.Job.rangeByType(type, status, 0, 1000000, 'asc', function (err, selectedJobs) {
        console.log(err, selectedJobs);

        selectedJobs.forEach(function (job) {
            //console.log(job);
            job.remove()
        });
    });
}

/**
 * If a job is in active mode for more than one hour (interval), it is considered as dead job
 * ==> we delete it and add it in active queue again
 * @param interval
 * @param maxTimeToExecute
 */

function resolveFailedjob(kue_engine, interval = 60000, maxTimeToExecute = 600000) {
    setInterval(() => {

        // first check the active job list (hopefully this is relatively small and cheap)
        // if this takes longer than a single "interval" then we should consider using
        // setTimeouts
        kue_engine.failed((err, ids) => {

            // for each id we're going to see how long ago the job was last "updated"
            async.map(ids, (id, cb) => {
                // we get the job info from redis
                kue.Job.get(id, (err, job) => {
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
                            console.log('job failed recreated done done')
                        });
                        // either reschedule (re-attempt?) or remove the job.

                        job.remove((err) => {

                        })


                    } else {
                        cb(null);
                    }

                });
            });
        });
    }, interval);
};


function resolveStuckjob(kue_engine, interval = 60000, maxTimeToExecute = 6000000) {
    setInterval(() => {

        // first check the active job list (hopefully this is relatively small and cheap)
        // if this takes longer than a single "interval" then we should consider using
        // setTimeouts
        kue_engine.active((err, ids) => {

            // for each id we're going to see how long ago the job was last "updated"
            async.map(ids, (id, cb) => {
                // we get the job info from redis
                kue.Job.get(id, (err, job) => {
                    if (err) {
                        throw err;
                    } // let's think about what makes sense here

                    // we compare the updated_at to current time.
                    var lastUpdate = +Date.now() - job.updated_at;
                    if (lastUpdate > maxTimeToExecute) {
                        sails.log.silly('job ' + job.id + ' hasnt been updated in ' + lastUpdate);
                        sails.log.silly('================> ', job.data, job.type);

                        //TODO to remove comment
                        createJobInKue(kue_engine, job.type, job.data, {}, function () {
                            sails.log.silly('job stuck recreated done done')
                        });
                        // either reschedule (re-attempt?) or remove the job.

                        job.remove((err) => {

                        })


                    } else {
                        cb(null);
                    }

                });
            });
        });
    }, interval);
};

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


