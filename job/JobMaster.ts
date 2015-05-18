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
    concurrency = 20;
    //getDataMaster;
    name;
    type;
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
        this.type = 'default';
        //this.collector = collector;
    }

    produce() {
        return new Promise((resolve, reject)=> {
            this
                .init()
                .then(()=> {
                    return this.collector.countElement()
                })
                .then(()=> {
                    //console.log(this.collector);
                    return console.log('this.collector.nbElements ', this.collector.nbElements)
                })
                .then(this.exec())
                .then(()=> {
                    resolve()
                })
                .catch(function (e) {
                    reject(e)
                })
        })
    }

    init(type? = this.type) {
        this.type = type;
        return new Promise((resolve, reject)=> {
            this.collector.init()
                .then(()=> {
                    console.log('init.done');
                    resolve()
                })
        })

    }


    unitTask(job) {
        return new Promise((resolve, reject)=> {
            resolve();
        })
    }

    exec() {
        return ()=> {
            return new Promise((resolve, reject)=> {
                //console.log('this.name, this.collector.name', this.name, this.collector.name, this.collector.data);
                var date = new Date();

                var q = async.queue((task, callback)=> {
                    this.addTask(task, callback)
                }, this.concurrency);


                for (var i = this.collector.start; i < this.collector.nbElements; i = i + this.collector.size) {

                    var data = {min: i, size: this.collector.size, condition: this.collector.filter}
                    //add tasks
                    //console.log('JobMaster.kue', JobMaster.kue.messages);
                    q.push(data, (err)=> {
                        console.log('finished processing item');
                    });
                }


                // assign a callback
                q.drain = ()=> {
                    console.log('all task have been add in ', new Date() - date);
                    resolve('done')
                }

            })
        }
    }


    consume(type) {

    }


    addTask(job, cb) {
        this.task(job)
            .then(this.collector.deleteOneData(job))
            .then(() => {
                cb()
            })

    }

    dataTransform(data) {
        return new Promise((resolve, reject)=> {
            return resolve(data);
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