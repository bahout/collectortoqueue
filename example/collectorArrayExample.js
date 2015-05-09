/**
 * Created by nicolasbahout on 26/04/15.
 */
var GetArrayData_1 = require('../collector/GetArrayData');
var arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
var collector = new GetArrayData_1.GetArrayData(arr);
//nb of data collected
collector.concurrency = 3;
collector
    .init()
    .then(collector.getData())
    .then(function () {
    //we could do something with the data.
    return console.log(collector.data);
})
    .then(collector.getData())
    .then(function () {
    //we could do something with the data.
    return console.log(collector.data);
})
    .then(collector.getData())
    .then(function () {
    //we could do something with the data.
    return console.log(collector.data);
});
//# sourceMappingURL=collectorArrayExample.js.map