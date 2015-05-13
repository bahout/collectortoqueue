/**
 * Created by nicolasbahout on 26/04/15.
 */

import  Promise = require('bluebird');
import _ = require('lodash');
import async = require('async');
import {JobMaster} from './JobMaster';
import kue = require('kue');


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
    type;
    dying;
    removeOnComplete = true;
    //messages
    /**
     *
     * @param redisconf : redis connection
     * @param collector : collector used
     * @param type : name of queue used
     */
    constructor(redisconf, collector?, type?) {
        super(collector);
        console.log('redisconf from constructor', redisconf);
        this.queue = kue.createQueue({redis: redisconf, disableSearch: true});
        this.queue.watchStuckJobs();
        this.name = 'JobKue';
        this.end();
    }


    /**
     * Used to remove task from kue for a type
     * @param type
     * @param status
     */
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


    /**
     * Add task to kue. Type has to be defined in constructor
     * @param data
     */
    task(data) {

        return new Promise((resolve, reject)=> {
            console.log('Send Task  ==>', data);
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


    /**
     * Task are consume here
     * @param type
     */
    execTask(type) {
        console.log('startprocess execTask', type, this.concurrency);
        var count = 0;
        return new Promise((resolve, reject)=> {
            console.log('concurrency ==', this.concurrency);
            this.queue.process(type, this.concurrency, (job, done) => {
                console.log('start process =', job.data);

                this.unitTask(job.data)
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
                    })
            });
            //resolve()
        })

    }


    end() {
        console.log('spy event uncaughtException and SIGTERM');

        process.on('uncaughtException', (err) => {
            console.log('uncaught exception', err.stack);
            this.die();
            this.dying = true;
        });

        process.on('SIGTERM', ()=> {
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
                    console.error('Kue DID NOT shutdown gracefully', err);
                }
                else {
                    console.info('Kue DID shutdown gracefully');
                }
                process.exit(1);
            })
        }
    }


    resolveStuckjob(interval = 5000, maxTimeToExecute = 6000000) {
        setInterval(() => {

            // first check the active job list (hopefully this is relatively small and cheap)
            // if this takes longer than a single "interval" then we should consider using
            // setTimeouts
            this.queue.active((err, ids) => {

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
                            console.log('================> ', job.data, this.type);
                            this.task(job.data).then(()=> {
                                console.log('job.id', job.id);
                                return 'done'
                            });  // either reschedule (re-attempt?) or remove the job.

                            job.remove((err) => {

                            })


                        } else {
                            cb(null);
                        }

                    });
                });
            });
        }, interval);
    }


}