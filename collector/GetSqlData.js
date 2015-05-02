/**
 * Created by nicolasbahout on 26/04/15.
 */
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var mysql = require('mysql');
var Promise = require('bluebird');
var _ = require('lodash');
var GetDataMaster_1 = require('./GetDataMaster');
Promise.promisifyAll(require('mysql/lib/Pool').prototype);
Promise.promisifyAll(require('mysql/lib/Connection').prototype);
var GetSqlData = (function (_super) {
    __extends(GetSqlData, _super);
    function GetSqlData(database, table, configMySql) {
        _super.call(this);
        this.database = database;
        this.table = table;
        this.data = [];
        this.start = 0;
        this.pool = mysql.createPool({
            database: database,
            host: configMySql.host,
            user: configMySql.user,
            password: configMySql.password
        });
        this.table = table;
        this.name = 'GetSqlData';
        this.mysqlCount = 'SELECT count(*) FROM ' + this.table;
    }
    GetSqlData.prototype.init = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.pool.getConnectionAsync()
                .then(function (db) {
                _this.db = db;
                resolve();
            });
        });
    };
    GetSqlData.prototype.countElement = function () {
        var _this = this;
        return function () {
            return new Promise(function (resolve, reject) {
                if (_this.db) {
                    _this.getElement(_this.mysqlCount)
                        .then(function () {
                        _this.nbElements = _this.rows[0]['count(*)'];
                        console.log('this.nbElements ', _this.nbElements);
                        resolve();
                    });
                }
                else {
                }
            });
        };
    };
    GetSqlData.prototype.mysqlExpression = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.mysqlQuery = 'SELECT * FROM ' + _this.table + ' ' + _this.filter + ' LIMIT ' + _this.start + ',' + _this.concurrency;
            console.log(_this.mysqlQuery);
            _this.getElement(_this.mysqlQuery)
                .then(function () {
                //console.log(this.getElement, this.rows);
                _this.data = _this.data = _this.rows;
                //console.log('this.rows ', _(this.rows).pluck('id').value());
                resolve();
            });
        });
    };
    GetSqlData.prototype.getElement = function (sqlExpression) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.db.queryAsync(sqlExpression)
                .spread(function (rows, columns) {
                _this.rows = rows;
                resolve();
            });
        });
    };
    GetSqlData.prototype.getData = function (nbmessage) {
        var _this = this;
        if (nbmessage === void 0) { nbmessage = 1; }
        return function () {
            return new Promise(function (resolve, reject) {
                _this.mysqlExpression()
                    .then(function () {
                    resolve();
                });
                _this.start = _this.concurrency + _this.start;
            });
        };
    };
    GetSqlData.prototype.deleteOneData = function (job) {
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
    GetSqlData.prototype.disconnect = function () {
        var _this = this;
        return function () {
            return new Promise(function (resolve, reject) {
                _this.pool.end(function (err) {
                    // The connection is terminated now
                });
            });
        };
    };
    return GetSqlData;
})(GetDataMaster_1.GetDataMaster);
exports.GetSqlData = GetSqlData;
//# sourceMappingURL=GetSqlData.js.map