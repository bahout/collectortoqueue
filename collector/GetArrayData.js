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
var GetArrayData = (function (_super) {
    __extends(GetArrayData, _super);
    function GetArrayData(arr) {
        _super.call(this);
        this.data = [];
        this.start = 0;
        this.arr = arr;
        console.log('collector created');
    }
    GetArrayData.prototype.init = function () {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    };
    GetArrayData.prototype._getData = function (nbmessage) {
        //console.log(this.size, nbmessage);
        var _this = this;
        if (this.size)
            nbmessage = this.size;
        return new Promise(function (resolve, reject) {
            //console.log('this.arr ==>', this.arr);
            //this.data = this.arr.shift();
            //this.data = this.arr.shift();
            _this.data = _.take(_this.arr, _this.size);
            _this.arr = _.takeRight(_this.arr, _this.arr.length - _this.size);
            resolve();
        });
    };
    return GetArrayData;
})(GetDataMaster_1.GetDataMaster);
exports.GetArrayData = GetArrayData;
//# sourceMappingURL=GetArrayData.js.map