/**
 * Created by nicolasbahout on 26/04/15.
 */
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var _ = require('lodash');
var GetDataMaster_1 = require('./GetDataMaster');
var Promise = require('bluebird');
var mongodb = Promise.promisifyAll(require('mongodb'));
var GetMongoData = (function (_super) {
    __extends(GetMongoData, _super);
    function GetMongoData(database, collectionName, config) {
        _super.call(this);
        this.database = database;
        this.collectionName = collectionName;
        this.data = [];
        this.filter = {};
        this.start = 0;
        console.log('object created');
        this.url = 'mongodb://' + config.host + ':' + config.port + '/' + database;
        _super.call(this);
    }
    GetMongoData.prototype.init = function (collectionName) {
        var _this = this;
        if (collectionName === void 0) { collectionName = this.collectionName; }
        this.collectionName = collectionName;
        return new Promise(function (resolve, reject) {
            console.log('this.url', _this.url);
            return mongodb.connectAsync(_this.url).then(function (db) {
                //console.log('Mongo init done ==>', db);
                _this.db = db;
                _this.collection = _this.db.collection(_this.collectionName);
                return resolve();
            }).catch(mongodb.MongoError, function (e) {
                throw new Error('Unable to connect to database: "' + e + '"');
            });
        });
    };
    GetMongoData.prototype.getElement = function (sqlExpression) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.db.queryAsync(sqlExpression)
                .spread(function (rows, columns) {
                _this.rows = rows;
                resolve();
            });
        });
    };
    GetMongoData.prototype.getData = function (nbmessage) {
        var _this = this;
        if (nbmessage === void 0) { nbmessage = 1; }
        return function () {
            return new Promise(function (resolve, reject) {
                //console.log('this.start =', this.start);
                console.log(_this.filter);
                _this.collection.find(_this.filter, { limit: _this.concurrency, skip: _this.start }).toArray(function (err, docs) {
                    _this.data = docs;
                    resolve();
                });
                _this.start = _this.concurrency + _this.start;
            });
        };
    };
    GetMongoData.prototype.deleteOneData = function (job) {
        var _this = this;
        return function () {
            return new Promise(function (resolve, reject) {
                //console.log('deleteMessage in', job.messagetext);
                if (!job)
                    return reject('job is require for deleteMessage(id)');
                _this.data = _(_this.data)
                    .map(function (currentObject) {
                    //console.log('currentObject.id === job.id', currentObject.id === job.id);
                    if (currentObject.id != job.id) {
                        return currentObject;
                    }
                })
                    .compact()
                    .value();
                //console.log('Kue.messages after remove  ==>', this.data);
                resolve();
                // Message deleted
            });
        };
    };
    GetMongoData.prototype.disconnect = function () {
        var _this = this;
        return function () {
            return new Promise(function (resolve, reject) {
                _this.db.close();
            });
        };
    };
    return GetMongoData;
})(GetDataMaster_1.GetDataMaster);
exports.GetMongoData = GetMongoData;
//# sourceMappingURL=GetMongoData.js.map