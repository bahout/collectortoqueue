/**
 * Send all sites to queue
 */

//import azure = require('azure-storage');
//import azure = require('azure');
import  Promise = require('bluebird');
import azure = require('azure-storage');
import config= require('./config.json');
import _ = require('lodash');
import {JobMaster} from '../job/JobMaster';



//var connString1 = 'Endpoint=sb://cl-sqs-cr.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=mWWVqY6sh2EfAgR0oMFH9yETh8jJoKYZ4E1VvCygbSo=';
//var serviceBusService = azure.createServiceBusService(connString1);


export class GetDataMaster {
    name;
    data = [];
    concurrency = 1;
    Job;
    filter = '';

    constructor() {
        this.name = 'GetDataMaster';
        this.Job = JobMaster;
    }


    init() {
        return new Promise((resolve, reject)=> {
            resolve()
        })
    }


    /**
     */
    getData(nbmessage = 1) {
        return new Promise((resolve, reject)=> {
            //add new messages
            this.data = []
        })
    }

    /**
     * Delete Message
     * @param id
     * @returns {function(): Promise}
     */
    deleteOneData(data) {
        return ()=> {
            return new Promise((resolve, reject)=> {
                //console.log('deleteMessage in', job.messagetext);
                resolve();
                // Message deleted
            })
        }
    }
}


