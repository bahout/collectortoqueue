/*
/!**
 * Created by nicolasbahout on 26/04/15.
 *!/

import  Promise = require('bluebird');
import _ = require('lodash');
import azure = require('azure');
import async = require('async');
import {JobMaster} from './JobMaster';


/!**
 * Kue has to have 2 methodes
 * 1) getMessages in order to get new data
 * Messages are stored in Kue.messages Array
 * 2) kue.deleteMessage(oneMessage) in Order
 *!/
export class JobAzureKue extends JobMaster {
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
    /!**
     *
     * @param getDataMaster
     * @param GetDataMaster
     * @param {concurrency} Nb job done in parallele
     *!/
    constructor(config, collector?) {
        super(collector);

        this.queue = azure.createQueueService(config.storageName, config.storageKey);

        this.name = 'JobAzureKue';


    }


    /!**
     * Add Task to
     * @param data
     *!/
    task(data) {
        return new Promise((resolve, reject)=> {

            data = this.dataTransform(data)
                .then((data)=> {

                    return this.queue.createMessage(this.type, data, (error, result, response)=> {
                        console.log('send done');
                        if (!error) {
                            resolve();
                        }
                        else {
                            console.log('error', error);
                            reject(error)
                        }
                    });


                })

        })
    }


    execTask(type, nbmessage = 1) {
        return new Promise((resolve, reject)=> {
            console.log('getMessage start from ', this.type);
            /!*this.queue.getMessages(this.type, {
                numOfMessages: nbmessage
                //visibilityTimeout: 5 * 60
            }, (error, job)=> {
                console.log('getMessage done', job);
                this.unitTask(job)
                    .then(()=> {
                        console.log('we delete message');
                        return resolve();

                        /!* return this.queue.deleteMessage(this.type, job.messageid, job.popreceipt, (deleteError)=> {
                         return resolve()
                         })*!/
                    }).catch((e)=> {
                        console.log('error in task', e);
                        return resolve();
                        /!*return this.queue.deleteMessage(this.type, job.messageid, job.popreceipt, (deleteError)=> {
                         return resolve()
                         })*!/
                        //return resolve()
                    })
            });*!/
            resolve();
        })

    }

    /!*
     /!**
     * Get Task and Executte
     * @param type
     *!/
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

     }*!/


}*/
//# sourceMappingURL=JobAzureKue.js.map