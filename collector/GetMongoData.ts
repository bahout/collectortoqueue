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
    options;


    constructor(public database, public collectionName, config) {
        super();
        console.log('object created');
        this.url = 'mongodb://' + config.host + ':' + config.port + '/' + database;

    }


    init(collectionName = this.collectionName) {
        console.log('mongo init collector');
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


    countElement() {
        return new Promise((resolve, reject)=> {
            if (!this.filter) this.filter = {};
            if (!this.options) this.options = {};

            var cursor = this.collection
                .find(this.filter, this.options);


            cursor.count((err, count)=> {
                //console.log(count);
                if (count) {
                    this.nbElements = count;
                    //console.log('this.nbElements ==>', count)
                    resolve();
                }
                else {
                    reject(err);
                }

            })

        })

    }


    _getData(nbmessage = 1) {
        return new Promise((resolve, reject)=> {
            //console.log('this.start =', this.start);
            if (!this.filter) this.filter = {};
            if (!this.options) this.options = {};

           // console.log('this ==', this);

            //this.options = _.extend(this.options, {limit: this.size, skip: this.start});
            //console.log(this.options);
            this.collection
                .find(this.filter, this.options)
                .limit(this.size)
                .skip(this.start)
                .toArray((err, docs)=> {
                    //console.log(docs);
                    this.data = docs;
                    resolve();
                });

        })

    }


    disconnect() {
        return () => {
            return new Promise((resolve, reject)=> {
                this.db.close()
            })
        }
    }


}


