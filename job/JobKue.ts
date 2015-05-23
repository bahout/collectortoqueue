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
export class JobKue {
    concurrency = 1;
    //getDataMaster;
    name;
    static GetDataMaster;
    collector;
    saver;
    queue;
    type;
    dying;
    removeOnComplete = true;
    //messages
    /**
     *
     * @param getDataMaster
     * @param GetDataMaster
     * @param {concurrency} Nb job done in parallele
     */
    constructor() {

    }


    remove(type, status = 'inactive') {
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
     * Send Task
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
     * Get Task and Execute
     * @param type
     */
    consume(comute) {
        //creat a queue
        var q = async.queue(comute, this.concurrency);

        var count = 0;
        //add data to queue
        _(this.collector.data).forEach((ele)=> {
            q.push(ele, (err, data)=> {
                //console.log('data ==>', data);
                count++;
                this.saver.data.push(data);
                console.log('finished processing ' + count);
            });
        }).value();

        // assign a callback
        q.drain = () => {
            console.log('all items have been processed');
            //exit of queue Kue
            this.saver.insertDocuments(this.saver.data).then(()=> {
                console.log('all items have been saved');

                this.saver.data = [];
                done();
                //exit of promises
                resolve()
            })

        };


    }


    commute(data, cb) {

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