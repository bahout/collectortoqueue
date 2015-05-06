/*
/!**
 * Send all sites to queue
 *!/

//import azure = require('azure-storage');
import azure = require('azure');
import config= require('./../../config.json');
import  Promise = require('bluebird');
import _ = require('lodash');
import {GetDataMaster} from './GetDataMaster';


//var connString1 = 'Endpoint=sb://cl-sqs-cr.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=mWWVqY6sh2EfAgR0oMFH9yETh8jJoKYZ4E1VvCygbSo=';
//var serviceBusService = azure.createServiceBusService(connString1);


export class GetKueData extends GetDataMaster {
    queueSvc;
    topic;
    meta;
    name;
    data;
    lockedMessage:any;
    content:string;
    static data = [];


    constructor(topic = 'url') {
        super();
        this.topic = topic;
        this.name = 'Kue';
        //this.queueSvc = azure.createServiceBusService(config.endpoint);
        this.queueSvc = azure.createQueueService(config.kueAzure.storageName, config.kueAzure.storageKey);
    }

    createTopic() {
        return new Promise((resolve, reject)=> {
            console.log('createTopic start');
            this.queueSvc.createQueueIfNotExists(this.topic, (error)=> {
                console.log('createTopic done');
                if (!error) {
                    resolve();
                    // Queue exists
                }
                else {
                    console.log('error', error);
                    reject(error)
                }
            });
        })
    }

    listTopic() {
        return new Promise((resolve, reject)=> {
            console.log('createTopic start');
            this.queueSvc.listTopics((error, listtopicsresult, resp)=> {
                console.log('createTopic done');
                if (!error) {
                    console.log('listtopicsresult', listtopicsresult);
                    resolve();
                    // Queue exists
                }
                else {
                    console.log('error', error);
                    reject(error)
                }
            });
        })
    }

    send(message = "Hello world! " + new Date()) {
        return ()=> {
            return new Promise((resolve, reject)=> {
                console.log('send start');
                this.queueSvc.createMessage(this.topic, message, (error, result, response)=> {
                    console.log('send done');
                    if (!error) {
                        resolve();
                    }
                    else {
                        console.log('error', error);
                        reject(error)
                    }
                });
            });
        }
    }


    getData(nbmessage = 1) {
        return ()=> {
            return new Promise((resolve, reject)=> {
                console.log('getMessage start from ', this.topic);
                this.queueSvc.getMessages(this.topic, {
                    numOfMessages: nbmessage
                    //visibilityTimeout: 5 * 60
                }, (error, messages)=> {
                    //console.log('getMessage done', messages);
                    if (!error) {
                        GetKueData.data = _(GetKueData.data).union(messages).compact().value();
                        console.log('Kue.messages ==>', GetKueData.data);
                        resolve();
                    }
                    else {
                        reject('error in getData', error)
                    }
                });
            })
        }
    }

    getQueueMetadata() {
        return ()=> {
            return new Promise((resolve, reject)=> {
                this.queueSvc.getQueueMetadata(this.topic, (error, result, response)=> {
                    if (!error) {
                        //console.log('meta', result, response);
                        this.meta = result;
                        resolve(result);
                    }
                    else {
                        reject('error', error)
                    }
                });
            })
        }
    }

    deletetopic() {
        return ()=> {
            return new Promise((resolve, reject)=> {
                this.queueSvc.deleteQueue(this.topic, (error, response)=> {
                    if (!error) {
                        // Queue has been deleted
                    }
                });
            })
        };
    }

    /!**
     * Delete Message
     * @param id
     * @returns {function(): Promise}
     *!/
    deleteOneData(job) {
        return ()=> {
            return new Promise((resolve, reject)=> {
                //console.log('deleteMessage in', job.messagetext);
                if (!job) return reject('job is require for deleteMessage(id)');
                this.queueSvc.deleteMessage(this.topic, job.messageid, job.popreceipt, (deleteError)=> {
                    if (!deleteError) {
                        console.log('delete job.messageid  ==>', job.messageid);
                        console.log(' Kue.messages before remove  ==>', GetKueData.data);

                        GetKueData.data = _(GetKueData.data)
                            .map(function (currentObject) {
                                console.log('currentObject.messageid === job.messageid', currentObject.messageid === job.messageid);
                                if (currentObject.messageid != job.messageid) {
                                    return currentObject
                                }
                            })
                            .compact()
                            .value();
                        console.log(' Kue.messages after remove  ==>', GetKueData.data);


                        resolve();
                        // Message deleted
                    }
                    else {
                        console.log('error in deleteMessage', job.messageid, deleteError);
                        reject('error', deleteError)
                    }
                })
            });
        }
    }
}

*/
