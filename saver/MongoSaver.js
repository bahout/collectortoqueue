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
var mongodb = Promise.promisifyAll(require('mongodb'));
var MongoClient = MongoDb.MongoClient;
var MongoSaver = (function (_super) {
    __extends(MongoSaver, _super);
    function MongoSaver(database, collectionName, config) {
        _super.call(this);
        this.database = database;
        this.collectionName = collectionName;
        this.url = 'mongodb://' + config.host + ':' + config.port + '/' + database;
        _super.call(this);
    }
    MongoSaver.prototype.init = function (collectionName) {
        var _this = this;
        if (collectionName === void 0) { collectionName = this.collectionName; }
        this.collectionName = collectionName;
        return new Promise(function (resolve, reject) {
            console.log('this.url', _this.url);
            return mongodb.connectAsync(_this.url).then(function (db) {
                console.log('Mongo init done ==>', db);
                _this.db = db;
                return resolve();
            }).catch(mongodb.MongoError, function (e) {
                throw new Error('Unable to connect to database: "' + e + '"');
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
    MongoSaver.prototype.insertDocuments = function (data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var collection = _this.db.collection(_this.collectionName);
            // Insert some documents
            collection.insert(data, function (err, result) {
                if (result)
                    return resolve(result);
                if (err)
                    return reject(err);
            });
        });
    };
    MongoSaver.prototype.updateDocuments = function (where, data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var collection = _this.db.collection(_this.collectionName);
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