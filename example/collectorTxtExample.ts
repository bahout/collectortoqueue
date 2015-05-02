/**
 * Created by nicolasbahout on 26/04/15.
 */

import  Promise = require('bluebird');
import _ = require('lodash');
import async = require('async');
import {GetSqlData} from '../collector/GetSqlData';
import {GetKueData} from '../collector/GetKueData';
import {GetTxtData} from '../collector/GetTxtData';
import {JobMaster} from '../job/JobMaster';



//define the source

var collector = new GetTxtData('../data/toto.txt');
//var collector = new GetSqlData('prestaleads', 'users');

//nb of data collected
collector.concurrency = 4;


collector
    .init()
    .then(collector.getData())
    .then(()=> {
        //we could do something with the data..
        return console.log(collector.data)
    })
    .then(collector.getData())
    .then(collector.getData())
    .then(()=> {
        //we could do something with the data..
        return console.log(collector.data)
    });


