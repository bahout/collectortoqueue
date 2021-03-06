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
    size;
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

    _getData(nbmessage?) {

        //console.log(this.size, nbmessage);

        if (this.size) nbmessage = this.size;

        return new Promise((resolve, reject)=> {
            //console.log('this.arr ==>', this.arr);
            //this.data = this.arr.shift();
            //this.data = this.arr.shift();

            this.data = _.take(this.arr, this.size);
            this.arr = _.takeRight(this.arr, this.arr.length - this.size);


            resolve();
        })
    }


}


