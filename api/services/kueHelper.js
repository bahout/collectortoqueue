/**
 * Created by nicolasbahout on 23/05/15.
 */
var Promise = require('bluebird');
module.exports = {
    hello: hello,
    updateAndSave: updateAndSave
};
function hello() {
    console.log('hello');
}
function queueProcess(col, comute, concurrency) {
    return new Promise(function (resolve, reject) {
        var saver = [];
        //creat a queue
        var q = async.queue(comute, concurrency);
        var count = 0;
        //add data to queue
        _(col).forEach(function (ele) {
            q.push(ele, function (err, data) {
                count++;
                saver.push(data);
                console.log('finished processing ' + count);
            });
        }).value();
        // assign a callback
        q.drain = function () {
            console.log('all items have been processed');
            //exit of queue Kue
            return resolve(saver);
        };
    });
}
function updateAndSave(modelFrom, modelTo, comute, options) {
    if (options === void 0) { options = {}; }
    return new Promise(function (resolve, reject) {
        var ModelFrom = sails.models[modelFrom.toLowerCase()];
        var ModelTo = sails.models[modelTo.toLowerCase()];
        return ModelFrom
            .find(options.condition || {})
            .limit(options.size || 50)
            .skip(options.min || 0)
            .then(function (col) {
            return queueProcess(col, comute, 1);
        })
            .then(function (col) {
            console.log('saved data 1');
            return ModelTo
                .findOrCreate({
                where: {
                    id: col.map(function (d) {
                        return d.id;
                    })
                }
            }, col)
                .then(function (data, err) {
                if (!err)
                    return resolve(data);
                if (err)
                    return reject(err);
            })
                .catch(function (err) {
                reject(err);
            });
        });
    });
}
//# sourceMappingURL=kueHelper.js.map