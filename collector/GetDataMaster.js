/**
 * Send all sites to queue
 */
//import azure = require('azure-storage');
//import azure = require('azure');
var Promise = require('bluebird');
var JobMaster_1 = require('../job/JobMaster');
var JsonDB = require('node-json-db');
//var connString1 = 'Endpoint=sb://cl-sqs-cr.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=mWWVqY6sh2EfAgR0oMFH9yETh8jJoKYZ4E1VvCygbSo=';
//var serviceBusService = azure.createServiceBusService(connString1);
var GetDataMaster = (function () {
    function GetDataMaster() {
        this.data = [];
        this.size = 1;
        this.filter = '';
        this.name = 'GetDataMaster';
        this.Job = JobMaster_1.JobMaster;
        this.txtdb = new JsonDB("collectortoqueueDb", true, false);
    }
    GetDataMaster.prototype.init = function () {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    };
    /**
     */
    /*    _getData(nbmessage = 1) {
     console.log('in wrong _getData')
     return new Promise((resolve, reject)=> {
     //add new messages
     resolve();
     this.data = []
     })
     }*/
    GetDataMaster.prototype.getData = function (nbmessage) {
        var _this = this;
        if (nbmessage === void 0) { nbmessage = 1; }
        return function () {
            return new Promise(function (resolve, reject) {
                _this._getData(nbmessage)
                    .then(function () {
                    return resolve();
                });
                _this.setLimit();
            });
        };
    };
    GetDataMaster.prototype.setLimit = function () {
        this.start = this.size + this.start;
        //save txtdb in order to restart from this point
        this.txtdb.push('/' + this.name + '/' + this.database + '/' + this.table, this.start);
    };
    /**
     * Delete Message
     * @param id
     * @returns {function(): Promise}
     */
    GetDataMaster.prototype.deleteOneData = function (data) {
        return function () {
            return new Promise(function (resolve, reject) {
                //console.log('deleteMessage in', job.messagetext);
                resolve();
                // Message deleted
            });
        };
    };
    return GetDataMaster;
})();
exports.GetDataMaster = GetDataMaster;
//# sourceMappingURL=GetDataMaster.js.map