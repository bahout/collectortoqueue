/**
 * Created by nicolasbahout on 26/04/15.
 */
var _ = require('lodash');
var GetSqlData_1 = require('../collector/GetSqlData');
var config = require('./../../config.json');
var config = config.mysql;
console.log('config', config);
//define the source
//var collector = new GetTxtData('../data/toto.txt');
var collector = new GetSqlData_1.GetSqlData('prestaleads', 'users', config);
//nb of data collected
collector.size = 3;
collector
    .init()
    .then(collector.getData())
    .then(function () {
    //we could do something with the data.
    return console.log(_(collector.data).pluck('id').value());
})
    .then(collector.getData())
    .then(function () {
    //we could do something with the data.
    return console.log(_(collector.data).pluck('id').value());
})
    .then(collector.getData())
    .then(function () {
        //we could do something with the data.
        return console.log(_(collector.data).pluck('id').value());
    })
    .then(function () {
    //we could do something with the data.
    return console.log(_(collector.data).pluck('id').value());
})
    .then(collector.disconnect());
/* .then(collector.getData())
 .then(collector.getData())
 .then(()=> {
 //we could do something with the data..
 return console.log(collector.data)
 });

 */
//# sourceMappingURL=collectorMySqlExample.js.map