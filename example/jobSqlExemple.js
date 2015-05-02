/**
 * Created by nicolasbahout on 26/04/15.
 */
var Promise = require('bluebird');
var GetSqlData_1 = require('../collector/GetSqlData');
var JobMaster_1 = require('../job/JobMaster');
var config = require('../config.json');
var config = config.mysql;
console.log('config', config);
//define the source
var collector = new GetSqlData_1.GetSqlData('prestaleads', 'users', config);
//nb of data collected
collector.concurrency = 3;
var job = new JobMaster_1.JobMaster(collector);
job.task = function (job) {
    return new Promise(function (resolve, reject) {
        console.log('my job  start =>', job);
        setTimeout(function () {
            console.log('my job  stop =>', job);
            resolve();
        }, 1000);
    });
};
job
    .init()
    .then(job.exec())
    .then(function () {
    console.log('====================== all task has been executed ======================');
})
    .catch(function (e) {
    console.log(e);
});
//# sourceMappingURL=jobSqlExemple.js.map