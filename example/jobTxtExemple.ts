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
collector.size = 1;


var job = new JobMaster(collector);

job.task = function (job) {
    return new Promise((resolve, reject)=> {
        console.log('my job  start =>', job);

        setTimeout(()=> {
            console.log('my job  stop =>', job);
            resolve();
        }, 1000)
    })
};


job
    .init()
    .then(job.exec())
    .then(function () {
        console.log('====================== all task has been executed ======================');
    })
    .catch(function (e) {
        console.log(e)
    });
