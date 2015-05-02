/**
 * Created by nicolasbahout on 26/04/15.
 */
var GetTxtData_1 = require('../collector/GetTxtData');
//define the source
var collector = new GetTxtData_1.GetTxtData('../data/toto.txt');
//var collector = new GetSqlData('prestaleads', 'users');
//nb of data collected
collector.concurrency = 4;
collector
    .init()
    .then(collector.getData())
    .then(function () {
    //we could do something with the data..
    return console.log(collector.data);
})
    .then(collector.getData())
    .then(collector.getData())
    .then(function () {
    //we could do something with the data..
    return console.log(collector.data);
});
//# sourceMappingURL=collectorTxtExample.js.map