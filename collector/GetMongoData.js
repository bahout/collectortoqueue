/**
 * Created by nicolasbahout on 26/04/15.
 */
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
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
        this.start = 0;
        console.log('object created');
        this.url = 'mongodb://' + config.host + ':' + config.port + '/' + database;
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
    GetMongoData.prototype.countElement = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this.filter)
                _this.filter = {};
            if (!_this.options)
                _this.options = {};
            var cursor = _this.collection
                .find(_this.filter, _this.options);
            cursor.count(function (err, count) {
                //console.log(count);
                if (count) {
                    _this.nbElements = count;
                    //console.log('this.nbElements ==>', count)
                    resolve();
                }
                else {
                    reject(err);
                }
            });
        });
    };
    GetMongoData.prototype._getData = function (nbmessage) {
        var _this = this;
        if (nbmessage === void 0) { nbmessage = 1; }
        return new Promise(function (resolve, reject) {
            //console.log('this.start =', this.start);
            if (!_this.filter)
                _this.filter = {};
            if (!_this.options)
                _this.options = {};
            //this.options = _.extend(this.options, {limit: this.size, skip: this.start});
            //console.log(this.options);
            _this.collection
                .find(_this.filter, _this.options)
                .limit(_this.size)
                .skip(_this.start)
                .toArray(function (err, docs) {
                //console.log(docs);
                _this.data = docs;
                resolve();
            });
        });
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