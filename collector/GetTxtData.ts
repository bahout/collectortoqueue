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


    _getData(nbmessage = 1) {
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

