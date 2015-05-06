/**
 * Created by nicolasbahout on 26/04/15.
 */

import _ = require('lodash');
import {GetDataMaster} from './GetDataMaster';
import MongoDb = require('mongodb');
import  Promise = require('bluebird');
var mongodb = Promise.promisifyAll(require('mongodb'));
import JsonDB = require('node-json-db');

export class GetMongoData extends GetDataMaster {
    pool;
    cursor;
    db;
    data = [];
    name;
    txtdb;
    url;
    collection;
    rows:Array<any>;
    nbElements:number;
    mysqlCount:string;
    mysqlQuery:string;
    start = 0;


    constructor(public database, public collectionName, config) {
        super();
        console.log('object created');
        this.url = 'mongodb://' + config.host + ':' + config.port + '/' + database;

    }


    init(collectionName = this.collectionName) {
        this.collectionName = collectionName;
        return new Promise((resolve, reject)=> {
            console.log('this.url', this.url);
            return mongodb.connectAsync(this.url).then((db) => {
                //console.log('Mongo init done ==>', db);
                this.db = db;
                this.collection = this.db.collection(this.collectionName);

                return resolve()

            }).catch(mongodb.MongoError, function (e) {
                throw new Error('Unable to connect to database: "' + e + '"');
            });
        })
    }


    getElement(sqlExpression) {
        return new Promise((resolve, reject)=> {
            this.db.queryAsync(sqlExpression)
                .spread((rows, columns)=> {
                    this.rows = rows;
                    resolve()
                });
        })

    }




    _getData(nbmessage = 1) {
        return ()=> {
            return new Promise((resolve, reject)=> {
                //console.log('this.start =', this.start);
                if (!this.filter) this.filter = {}
                this.collection.find(this.filter, {limit: this.concurrency, skip: this.start}).toArray((err, docs)=> {
                    this.data = docs;
                    resolve();
                });

            })
        }
    }


    deleteOneData(job) {
        return ()=> {
            return new Promise((resolve, reject)=> {
                //console.log('deleteMessage in', job.messagetext);
                if (!job) return reject('job is require for deleteMessage(id)');

                this.data = _(this.data)
                    .map(function (currentObject) {
                        //console.log('currentObject.id === job.id', currentObject.id === job.id);
                        if (currentObject.id != job.id) {
                            return currentObject
                        }
                    })
                    .compact()
                    .value();

                //console.log('Kue.messages after remove  ==>', this.data);

                resolve();
                // Message deleted

            });
        }
    }


    disconnect() {
        return () => {
            return new Promise((resolve, reject)=> {
                this.db.close()
            })
        }
    }


}


