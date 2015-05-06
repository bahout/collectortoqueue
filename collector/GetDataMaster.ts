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
import JsonDB = require('node-json-db');


//var connString1 = 'Endpoint=sb://cl-sqs-cr.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=mWWVqY6sh2EfAgR0oMFH9yETh8jJoKYZ4E1VvCygbSo=';
//var serviceBusService = azure.createServiceBusService(connString1);


export class GetDataMaster {
    name;
    data = [];
    concurrency = 1;
    Job;
    filter = '';
    txtdb;

    constructor() {
        this.name = 'GetDataMaster';
        this.Job = JobMaster;
        this.txtdb = new JsonDB("collectortoqueueDb", true, false);

    }


    init() {
        return new Promise((resolve, reject)=> {
            resolve()
        })
    }


    /**
     */
    /*    _getData(nbmessage = 1) {
     console.log('in wrong _getData')
     return new Promise((resolve, reject)=> {
     //add new messages
     resolve();
     this.data = []
     })
     }*/

    getData(nbmessage = 1) {
        return ()=> {
            return new Promise((resolve, reject)=> {
                this._getData(nbmessage)
                    .then(()=> {
                        return this._getData(nbmessage)
                    }).then(()=> {
                        return resolve()
                    });

                this.setLimit();
            })
        }
    }

    setLimit() {
        this.start = this.concurrency + this.start;
        //save txtdb in order to restart from this point
        this.txtdb.push('/' + this.name + '/' + this.database + '/' + this.table, this.start)
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


