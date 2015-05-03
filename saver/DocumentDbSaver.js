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
var documentdb = require('documentdb');
var Promise = require('bluebird');
var DocumentClient = documentdb.DocumentClient;
/**
 * Azure DocumentDb is very similar as Mongo
 */
var DocumentDbSaver = (function (_super) {
    __extends(DocumentDbSaver, _super);
    function DocumentDbSaver(config) {
        var host = config.endpoint;
        var masterKey = config.key; // Add the massterkey of the endpoint
        this.dbName = config.db;
        this.client = new DocumentClient(host, { masterKey: masterKey });
        _super.call(this);
    }
    DocumentDbSaver.prototype.init = function (collectionName, dbName) {
        var _this = this;
        if (dbName === void 0) { dbName = this.dbName; }
        if (!dbName)
            var dbName = this.dbName;
        return new Promise(function (resolve, reject) {
            _this.getOrCreateDatabase(dbName, function (db) {
                _this.db_self = db._self;
                _this.getOrCreateCollection(_this.db_self, collectionName, function (col) {
                    _this.col_self = col._self;
                    resolve();
                });
            });
        });
    };
    DocumentDbSaver.prototype.insertDocuments = function (data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this._insertDocuments(data, _this.col_self, function () {
                resolve();
            });
        });
    };
    DocumentDbSaver.prototype.getDocumentById = function (collectionLink, id, callback) {
        var _this = this;
        var querySpec = {
            query: 'SELECT * FROM Families f WHERE  f.id = @id',
            parameters: [
                {
                    name: '@id',
                    value: id
                }
            ]
        };
        this.client.queryDocuments(collectionLink, querySpec).toArray(function (err, results) {
            if (err) {
                _this.handleError(err);
            }
            if (results.length === 0) {
                throw ("No document found with id matching '" + id + "'");
            }
            else if (results.length > 1) {
                throw ("More than one document found matching id '" + id + "'");
            }
            else {
                callback(results[0]);
            }
        });
    };
    DocumentDbSaver.prototype._insertDocuments = function (data, collectionLink, callback) {
        var _this = this;
        var createdList = [];
        var counter = 0;
        this.client.createDocument(collectionLink, data, function (err, created) {
            if (err) {
                console.log('error', err);
                _this.handleError(err);
            }
            console.log('Document with id \'' + created.id + '\' created.');
            callback();
        });
    };
    DocumentDbSaver.prototype.getOrCreateDatabase = function (databaseId, callback) {
        var _this = this;
        var querySpec = {
            query: 'SELECT * FROM root r WHERE r.id=@id',
            parameters: [
                {
                    name: '@id',
                    value: databaseId
                }
            ]
        };
        this.client.queryDatabases(querySpec).toArray(function (err, results) {
            if (err) {
                _this.handleError(err);
            }
            if (results.length === 0) {
                console.log('Database \'' + databaseId + '\'not found');
                var databaseDef = { id: databaseId };
                _this.client.createDatabase(databaseDef, function (err, created) {
                    if (err) {
                        _this.handleError(err);
                    }
                    console.log('Database \'' + databaseId + '\'created');
                    callback(created);
                });
            }
            else {
                console.log('Database \'' + databaseId + '\'found');
                callback(results[0]);
            }
        });
    };
    DocumentDbSaver.prototype.getOrCreateCollection = function (databaseLink, collectionId, callback) {
        var _this = this;
        var querySpec = {
            query: 'SELECT * FROM root r WHERE r.id=@id',
            parameters: [
                {
                    name: '@id',
                    value: collectionId
                }
            ]
        };
        this.client.queryCollections(databaseLink, querySpec)
            .toArray(function (err, results) {
            if (err) {
                _this.handleError(err);
            }
            if (results.length === 0) {
                console.log('Collection \'' + collectionId + '\'not found');
                var collectionDef = { id: collectionId };
                _this.client.createCollection(databaseLink, collectionDef, function (err, created) {
                    if (err) {
                        _this.handleError(err);
                    }
                    console.log('Collection \'' + collectionId + '\'created');
                    callback(created);
                });
            }
            else {
                console.log('Collection \'' + collectionId + '\'found');
                callback(results[0]);
            }
        });
    };
    DocumentDbSaver.prototype.deleteCollection = function (collection, callback) {
        var _this = this;
        this.client.deleteCollection(collection._self, function (err) {
            if (err) {
                _this.handleError(err);
            }
            else {
                console.log('Collection \'' + collection.id + '\'deleted');
                callback();
            }
        });
    };
    DocumentDbSaver.prototype.deleteDatabase = function (database, callback) {
        var _this = this;
        this.client.deleteDatabase(database._self, function (err) {
            if (err) {
                _this.handleError(err);
            }
            else {
                console.log('Database \'' + database.id + '\'deleted');
                callback();
            }
        });
    };
    DocumentDbSaver.prototype.handleError = function (error) {
        console.log();
        console.log('An error with code \'' + error.code + '\' has occurred:');
        console.log('\t' + JSON.parse(error.body).message);
        console.log();
    };
    return DocumentDbSaver;
})(MasterSaver_1.MasterSaver);
exports.DocumentDbSaver = DocumentDbSaver;
//# sourceMappingURL=DocumentDbSaver.js.map