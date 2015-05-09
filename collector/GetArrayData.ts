/**
 * Created by nicolasbahout on 26/04/15.
 */

import _ = require('lodash');
import {GetDataMaster} from './GetDataMaster';
import MongoDb = require('mongodb');
import  Promise = require('bluebird');
var mongodb = Promise.promisifyAll(require('mongodb'));
import JsonDB = require('node-json-db');

export class GetArrayData extends GetDataMaster {
    pool;
    cursor;
    db;
    data = [];
    name;
    txtdb;
    url;
    arr;
    collection;
    rows:Array<any>;
    nbElements:number;
    mysqlCount:string;
    mysqlQuery:string;
    start = 0;
    options;


    constructor(arr) {
        super();
        this.arr = arr;
        console.log('collector created');
    }

    init() {
        return new Promise((resolve, reject)=> {
            resolve()
        })
    }

    _getData(nbmessage = 1) {
        return new Promise((resolve, reject)=> {
            //console.log('this.arr ==>', this.arr);
            this.data = this.arr.shift();
            resolve();
        })
    }


}


