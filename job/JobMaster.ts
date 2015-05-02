/**
 * Created by nicolasbahout on 26/04/15.
 */

import  Promise = require('bluebird');
import _ = require('lodash');
import async = require('async');


/**
 * Kue has to have 2 methodes
 * 1) getMessages in order to get new data
 * Messages are stored in Kue.messages Array
 * 2) kue.deleteMessage(oneMessage) in Order
 */
export class JobMaster {
    concurrency = 2;
    //getDataMaster;
    name;
    static GetDataMaster;
    //messages
    /**
     *
     * @param getDataMaster
     * @param GetDataMaster
     * @param {concurrency} Nb job done in parallele
     */
    constructor(public collector?) {
        this.name = 'JobMaster';
        //this.collector = collector;
    }


    init() {
        return new Promise((resolve, reject)=> {
            this.collector.init()
                .then(()=> {
                    console.log('init.done');
                    resolve()
                })
        })

    }


    exec() {
        this.collector.concurrency = this.concurrency;

        return ()=> {
            return new Promise((resolve, reject)=> {
                var executeAlljobs = ()=> {
                    //console.log('this.name, this.collector.name', this.name, this.collector.name, this.collector.data);

                    this._exec(this.collector.data)
                        .then(this.collector.getData())
                        .then(()=> {

                            console.log('JobMaster.GetDataMaster.data.length', this.collector.data.length);
                            if (this.collector.data == 0) {
                                console.log('we try to resolve');
                                return resolve()
                            }
                            executeAlljobs()
                        })
                };
                console.log('this.name, this.collector.name)', this.name, this.collector.name, this.collector.data);
                return executeAlljobs();
            })

        }
    }

    _exec(data) {
        return new Promise((resolve, reject)=> {
            //queue for task
            var q = async.queue((task, callback)=> {
                this.execUnit(task, callback)
            }, this.concurrency);


            //add tasks
            //console.log('JobMaster.kue', JobMaster.kue.messages);
            q.push(data, (err)=> {
                //console.log('finished processing item');
            });


            // assign a callback
            q.drain = ()=> {
                console.log('all items have been processed');
                resolve('done')
            }

        })
    }

    execUnit(job, cb) {

        this.task(job)
            .then(this.collector.deleteOneData(job))
            .then(() => {
                cb()
            })

    }

    task(job) {
        return new Promise((resolve, reject)=> {
            console.log('commute job', job);
            resolve();
        })
    }

    send(job) {

        this.task(job);
    }

}