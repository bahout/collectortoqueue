var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/**
 * Created by nicolasbahout on 02/05/15.
 */
var MasterSaver_1 = require('./MasterSaver');
var MongoDb = require('mongodb');
var Promise = require('bluebird');
var MongoClient = MongoDb.MongoClient;
var MongoSaver = (function (_super) {
    __extends(MongoSaver, _super);
    function MongoSaver(config) {
        this.url = 'mongodb://' + config.host + ':' + config.port + '/' + config.db;
        _super.call(this);
    }
    MongoSaver.prototype.init = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            console.log('this.url', _this.url);
            MongoClient.connect(_this.url, function (err, db) {
                _this.db = db;
                resolve();
            });
        });
    };
    MongoSaver.prototype.disconnect = function () {
        var _this = this;
        return function () {
            return new Promise(function (resolve, reject) {
                _this.db.close();
            });
        };
    };
    MongoSaver.prototype.insertDocuments = function (collectionName, data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var collection = _this.db.collection(collectionName);
            // Insert some documents
            collection.insert(data, function (err, result) {
                if (result)
                    return resolve(result);
                if (err)
                    return reject(err);
            });
        });
    };
    MongoSaver.prototype.updateDocuments = function (collectionName, where, data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var collection = _this.db.collection(collectionName);
            // Insert some documents
            collection.update({ where: where }, { $set: data }, { upsert: true }, function (err, result) {
                if (result)
                    return resolve(result);
                if (err)
                    return reject(err);
            });
        });
    };
    return MongoSaver;
})(MasterSaver_1.MasterSaver);
exports.MongoSaver = MongoSaver;
//# sourceMappingURL=MongoSaver.js.map