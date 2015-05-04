/**
 * Created by nicolasbahout on 26/04/15.
 */

import  Promise = require('bluebird');
import _ = require('lodash');
import async = require('async');
import {JobMaster} from './JobMaster';
import kue = require('kue');
import sentinel = require('redis-sentinel');


/**
 * Kue has to have 2 methodes
 * 1) getMessages in order to get new data
 * Messages are stored in Kue.messages Array
 * 2) kue.deleteMessage(oneMessage) in Order
 */
export class JobKue extends JobMaster {
    concurrency = 2;
    //getDataMaster;
    name;
    static GetDataMaster;
    collector;
    queue;
    type = 'url';
    dying;
    removeOnComplete = true;
    //messages
    /**
     *
     * @param getDataMaster
     * @param GetDataMaster
     * @param {concurrency} Nb job done in parallele
     */
    constructor(redisconf, collector?) {
        super(collector);
        this.queue = kue.createQueue({redis: redisconf});
        this.queue.watchStuckJobs();
        this.name = 'JobKue';

        //this.resolveStuckjob();
        this.end();
    }


    removeAll(type, status = 'inactive') {
        console.log('start remove jobs ', type, ' ', status);
        kue.Job.rangeByType(type, status, 0, 1000000, 'asc', function (err, selectedJobs) {
            console.log(err, selectedJobs);

            selectedJobs.forEach(function (job) {
                //console.log(job);
                job.remove()
            });
        });
    }

    dataTransform(data) {
        return new Promise((resolve, reject)=> {
            return resolve(data);
        })
    }

    task(data) {
        return new Promise((resolve, reject)=> {

            data = this.dataTransform(data)
                .then((data)=> {

                    return this.queue.create(this.type, data)
                        .attempts(2)
                        //.priority(5)
                        //.delay(5)
                        //.removeOnComplete(this.removeOnComplete)
                        .save(function (err) {
                            if (!err) {
                                //console.log(job.id);

                                resolve()
                            }
                        });

                })

        })
    }

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

    unitTask(job) {
        return new Promise((resolve, reject)=> {
            resolve();
        })
    }


    end() {
        console.log('spy event uncaughtException and SIGTERM');

        process.on('uncaughtException', function (err) {
            console.log.error('uncaught exception', err.stack);
            this.die();
            this.dying = true;
        });

        process.on('SIGTERM', function () {
            console.log('SIGTERM');
            this.die();
            this.dying = true;
        });
    }

    die() {
        console.log('in die');
        if (!this.dying) {
            this.queue.shutdown((err) => {
                if (err) {
                    log.error('Kue DID NOT shutdown gracefully', err);
                }
                else {
                    log.info('Kue DID shutdown gracefully');
                }
                process.exit(1);
            })
        }
    }

    /*
     resolveStuckjob(interval = 5000, maxTimeToExecute = 120000) {
     setInterval(() => {

     // first check the active job list (hopefully this is relatively small and cheap)
     // if this takes longer than a single "interval" then we should consider using
     // setTimeouts
     this.queue.active((err, ids) => {

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
     console.log('job ' + job.id + 'hasnt been updated in' + lastUpdate);
     this.task(job).then(()=> {
     return 'done'
     });  // either reschedule (re-attempt?) or remove the job.
     } else {
     cb(null);
     }

     });
     });
     });
     }, interval);
     }
     */

}