/**
 * Send all sites to queue
 */

//import azure = require('azure-storage');
//import azure = require('azure');
import  Promise = require('bluebird');
import config= require('./config.json');
import _ = require('lodash');
import {GetDataMaster} from './GetDataMaster';
import fs = require("fs");
var messages = [
    {
        content: 1,
        id: 1
    }, {
        content: 2,
        id: 2
    }, {
        content: 3,
        id: 3
    }, {
        content: 4,
        id: 4
    }, {
        content: 5,
        id: 5
    }, {
        content: 6,
        id: 6
    }, {
        content: 7,
        id: 7
    }, {
        content: 8,
        id: 8
    }, {
        content: 9,
        id: 9
    }];


//var connString1 = 'Endpoint=sb://cl-sqs-cr.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=mWWVqY6sh2EfAgR0oMFH9yETh8jJoKYZ4E1VvCygbSo=';
//var serviceBusService = azure.createServiceBusService(connString1);


export class GetTxtData extends GetDataMaster {
    name;
    filename;
    static allData = [];
    static separator;
    data = [];


    constructor(filename) {
        super();
        this.name = 'GetTxtData';
        GetTxtData.separator = '\n';
        if (!filename) throw 'filename is required';
        this.filename = filename;

    }

    init() {
        return new Promise((resolve, reject)=> {
            this.readFileSync()
                .then(()=> {
                    console.log('GetTxtData init done');
                    return resolve()
                });
        })
    }


    getData(nbmessage = 1) {
        return ()=> {
            return new Promise((resolve, reject)=> {
                this.data = GetTxtData.allData.splice(0, this.concurrency);
                console.log('GetTxtData.data ==>', this.data);
                resolve();

            })
        }
    }


    readFileSync() {
        return new Promise((resolve, reject)=> {
            fs.readFile(this.filename, "utf8", (err, data) => {
                if (err) throw err;
                GetTxtData.allData = _(data)
                    .split(GetTxtData.separator)
                    .compact()
                    .value();
                resolve();
            });
        })
    }


    /**
     * Delete Message
     * @param id
     * @returns {function(): Promise}
     */
    deleteOneData(job) {
        return ()=> {
            return new Promise((resolve, reject)=> {

                this.data = _(this.data)
                    .map(function (currentObject) {
                        if (currentObject.id != job.id) {
                            return currentObject
                        }
                    })
                    .compact()
                    .value();
                console.log(' GetTxtData.GetTxtData after remove  ==>', this.data);

                resolve();
                //console.log('deleteMessage in', job.messagetext);
            });
        }
    }
}

