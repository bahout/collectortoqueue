/**
 * Send all sites to queue
 */
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
//import azure = require('azure-storage');
//import azure = require('azure');
var Promise = require('bluebird');
var _ = require('lodash');
var GetDataMaster_1 = require('./GetDataMaster');
var fs = require("fs");
var GetTxtData = (function (_super) {
    __extends(GetTxtData, _super);
    function GetTxtData(filename) {
        _super.call(this);
        this.data = [];
        this.name = 'GetTxtData';
        GetTxtData.separator = '\n';
        if (!filename)
            throw 'filename is required';
        this.filename = filename;
    }
    GetTxtData.prototype.init = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.readFileSync()
                .then(function () {
                console.log('GetTxtData init done');
                return resolve();
            });
        });
    };
    GetTxtData.prototype._getData = function (nbmessage) {
        var _this = this;
        if (nbmessage === void 0) { nbmessage = 1; }
        return function () {
            return new Promise(function (resolve, reject) {
                _this.data = GetTxtData.allData.splice(0, _this.concurrency);
                console.log('GetTxtData.data ==>', _this.data);
                resolve();
            });
        };
    };
    GetTxtData.prototype.readFileSync = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            fs.readFile(_this.filename, "utf8", function (err, data) {
                if (err)
                    throw err;
                GetTxtData.allData = _(data)
                    .split(GetTxtData.separator)
                    .compact()
                    .value();
                resolve();
            });
        });
    };
    /**
     * Delete Message
     * @param id
     * @returns {function(): Promise}
     */
    GetTxtData.prototype.deleteOneData = function (job) {
        var _this = this;
        return function () {
            return new Promise(function (resolve, reject) {
                _this.data = _(_this.data)
                    .map(function (currentObject) {
                    if (currentObject.id != job.id) {
                        return currentObject;
                    }
                })
                    .compact()
                    .value();
                console.log(' GetTxtData.GetTxtData after remove  ==>', _this.data);
                resolve();
                //console.log('deleteMessage in', job.messagetext);
            });
        };
    };
    GetTxtData.allData = [];
    return GetTxtData;
})(GetDataMaster_1.GetDataMaster);
exports.GetTxtData = GetTxtData;
//# sourceMappingURL=GetTxtData.js.map