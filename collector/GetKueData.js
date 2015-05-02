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
//var connString1 = 'Endpoint=sb://cl-sqs-cr.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=mWWVqY6sh2EfAgR0oMFH9yETh8jJoKYZ4E1VvCygbSo=';
//var serviceBusService = azure.createServiceBusService(connString1);
var GetKueData = (function (_super) {
    __extends(GetKueData, _super);
    function GetKueData(topic) {
        if (topic === void 0) { topic = 'url'; }
        _super.call(this);
        this.topic = topic;
        this.name = 'Kue';
        //this.queueSvc = azure.createServiceBusService(config.endpoint);
        this.queueSvc = azure.createQueueService(config.storageName, config.storageKey);
    }
    GetKueData.prototype.createTopic = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            console.log('createTopic start');
            _this.queueSvc.createQueueIfNotExists(_this.topic, function (error) {
                console.log('createTopic done');
                if (!error) {
                    resolve();
                }
                else {
                    console.log('error', error);
                    reject(error);
                }
            });
        });
    };
    GetKueData.prototype.listTopic = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            console.log('createTopic start');
            _this.queueSvc.listTopics(function (error, listtopicsresult, resp) {
                console.log('createTopic done');
                if (!error) {
                    console.log('listtopicsresult', listtopicsresult);
                    resolve();
                }
                else {
                    console.log('error', error);
                    reject(error);
                }
            });
        });
    };
    GetKueData.prototype.send = function (message) {
        var _this = this;
        if (message === void 0) { message = "Hello world! " + new Date(); }
        return function () {
            return new Promise(function (resolve, reject) {
                console.log('send start');
                _this.queueSvc.createMessage(_this.topic, message, function (error, result, response) {
                    console.log('send done');
                    if (!error) {
                        resolve();
                    }
                    else {
                        console.log('error', error);
                        reject(error);
                    }
                });
            });
        };
    };
    GetKueData.prototype.getData = function (nbmessage) {
        var _this = this;
        if (nbmessage === void 0) { nbmessage = 1; }
        return function () {
            return new Promise(function (resolve, reject) {
                console.log('getMessage start from ', _this.topic);
                _this.queueSvc.getMessages(_this.topic, {
                    numOfMessages: nbmessage
                }, function (error, messages) {
                    //console.log('getMessage done', messages);
                    if (!error) {
                        GetKueData.data = _(GetKueData.data).union(messages).compact().value();
                        console.log('Kue.messages ==>', GetKueData.data);
                        resolve();
                    }
                    else {
                        reject('error in getData', error);
                    }
                });
            });
        };
    };
    GetKueData.prototype.getQueueMetadata = function () {
        var _this = this;
        return function () {
            return new Promise(function (resolve, reject) {
                _this.queueSvc.getQueueMetadata(_this.topic, function (error, result, response) {
                    if (!error) {
                        //console.log('meta', result, response);
                        _this.meta = result;
                        resolve(result);
                    }
                    else {
                        reject('error', error);
                    }
                });
            });
        };
    };
    GetKueData.prototype.deletetopic = function () {
        var _this = this;
        return function () {
            return new Promise(function (resolve, reject) {
                _this.queueSvc.deleteQueue(_this.topic, function (error, response) {
                    if (!error) {
                    }
                });
            });
        };
    };
    /**
     * Delete Message
     * @param id
     * @returns {function(): Promise}
     */
    GetKueData.prototype.deleteOneData = function (job) {
        var _this = this;
        return function () {
            return new Promise(function (resolve, reject) {
                //console.log('deleteMessage in', job.messagetext);
                if (!job)
                    return reject('job is require for deleteMessage(id)');
                _this.queueSvc.deleteMessage(_this.topic, job.messageid, job.popreceipt, function (deleteError) {
                    if (!deleteError) {
                        console.log('delete job.messageid  ==>', job.messageid);
                        console.log(' Kue.messages before remove  ==>', GetKueData.data);
                        GetKueData.data = _(GetKueData.data)
                            .map(function (currentObject) {
                            console.log('currentObject.messageid === job.messageid', currentObject.messageid === job.messageid);
                            if (currentObject.messageid != job.messageid) {
                                return currentObject;
                            }
                        })
                            .compact()
                            .value();
                        console.log(' Kue.messages after remove  ==>', GetKueData.data);
                        resolve();
                    }
                    else {
                        console.log('error in deleteMessage', job.messageid, deleteError);
                        reject('error', deleteError);
                    }
                });
            });
        };
    };
    GetKueData.data = [];
    return GetKueData;
})(GetDataMaster_1.GetDataMaster);
exports.GetKueData = GetKueData;
//# sourceMappingURL=GetKueData.js.map