/**
 * Created by nicolasbahout on 26/04/15.
 */
var _ = require('lodash');
var GetMongoData_1 = require('../collector/GetMongoData');
var config = require('./../../config.json');
//define the source
//var collector = new GetTxtData('../data/toto.txt');
var collector = new GetMongoData_1.GetMongoData('cl-task', 'siren2', config.mongoAzure);
//nb of data collected
collector.size = 20;
collector
    .init()
    .then(collector.getData())
    .then(function () {
    //we could do something with the data.
    return console.log(_(collector.data).pluck('_id').value());
})
    .then(collector.getData())
    .then(function () {
    //we could do something with the data.
    return console.log(_(collector.data).pluck('_id').value());
})
    .then(collector.getData())
    .then(function () {
    //we could do something with the data.
    return console.log(_(collector.data).pluck('_id').value());
})
    .then(collector.getData())
    .then(function () {
    //we could do something with the data.
    return console.log(_(collector.data).pluck('_id').value());
}).then(collector.getData())
    .then(function () {
    //we could do something with the data.
    return console.log(_(collector.data).pluck('_id').value());
}).then(collector.getData())
    .then(function () {
    //we could do something with the data.
    return console.log(_(collector.data).pluck('_id').value());
}).then(collector.getData())
    .then(function () {
    //we could do something with the data.
    return console.log(_(collector.data).pluck('_id').value());
})
    .then(collector.disconnect());
/* .then(collector.getData())
 .then(collector.getData())
 .then(()=> {
 //we could do something with the data..
 return console.log(collector.data)
 });

 */
//# sourceMappingURL=collectorMongoExample.js.map