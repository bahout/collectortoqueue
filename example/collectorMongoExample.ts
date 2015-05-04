/**
 * Created by nicolasbahout on 26/04/15.
 */

import  Promise = require('bluebird');
import _ = require('lodash');
import async = require('async');
import {GetSqlData} from '../collector/GetSqlData';
import {GetKueData} from '../collector/GetKueData';
import {GetMongoData} from '../collector/GetMongoData';
import {GetTxtData} from '../collector/GetTxtData';
import {JobMaster} from '../job/JobMaster';
import config= require('./../../config.json');

var config = config.mongoAzure;
console.log('config', config);

//define the source

//var collector = new GetTxtData('../data/toto.txt');
var collector = new GetMongoData('recommand', 'url', config);

//nb of data collected
collector.concurrency = 100;


collector
    .init()
    .then(collector.getData())
    .then(()=> {
        //we could do something with the data.
        return console.log(_(collector.data).pluck('_id').value())
    })
    .then(collector.getData())
    .then(()=> {
        //we could do something with the data.
        return console.log(_(collector.data).pluck('_id').value())
    })
    .then(collector.getData())
    .then(()=> {
        //we could do something with the data.
        return console.log(_(collector.data).pluck('_id').value())
    })
    .then(collector.disconnect());
/* .then(collector.getData())
 .then(collector.getData())
 .then(()=> {
 //we could do something with the data..
 return console.log(collector.data)
 });

 */
