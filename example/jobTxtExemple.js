/**
 * Created by nicolasbahout on 26/04/15.
 */
var Promise = require('bluebird');
var GetTxtData_1 = require('../collector/GetTxtData');
var JobMaster_1 = require('../job/JobMaster');
//define the source
var collector = new GetTxtData_1.GetTxtData('../data/toto.txt');
//var collector = new GetSqlData('prestaleads', 'users');
//nb of data collected
collector.size = 1;
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
//# sourceMappingURL=jobTxtExemple.js.map