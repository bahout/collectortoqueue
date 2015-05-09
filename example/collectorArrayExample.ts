/**
 * Created by nicolasbahout on 26/04/15.
 */

import  Promise = require('bluebird');
import _ = require('lodash');
import async = require('async');
import {GetArrayData} from '../collector/GetArrayData';

import {JobMaster} from '../job/JobMaster';


var arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
var collector = new GetArrayData(arr);
//nb of data collected
collector.concurrency = 3;


collector
    .init()
    .then(collector.getData())
    .then(()=> {
        //we could do something with the data.
        return console.log(collector.data)
    })
    .then(collector.getData())
    .then(()=> {
        //we could do something with the data.
        return console.log(collector.data)
    })
    .then(collector.getData())
    .then(()=> {
        //we could do something with the data.
        return console.log(collector.data)
    })
