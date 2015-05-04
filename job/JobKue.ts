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
        this.name = 'JobKue';
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


}