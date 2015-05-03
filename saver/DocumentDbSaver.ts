/**
 * Created by nicolasbahout on 02/05/15.
 */
import {MasterSaver} from './MasterSaver';
import documentdb  = require('documentdb')
import  Promise = require('bluebird');

var DocumentClient = documentdb.DocumentClient;

/**
 * Azure DocumentDb is very similar as Mongo
 */

export class DocumentDbSaver extends MasterSaver {
    err;
    client;
    database;
    collection;
    dbName;
    db_self;
    col_self;

    constructor(config:JSON) {
        var host = config.endpoint;
        var masterKey = config.key;  // Add the massterkey of the endpoint
        this.dbName = config.db;
        this.client = new DocumentClient(host, {masterKey: masterKey});
        super()
    }

    init(collectionName, dbName = this.dbName) {
        if (!dbName) var dbName = this.dbName;
        return new Promise((resolve, reject)=> {
            this.getOrCreateDatabase(dbName, (db:JSON)=> {
                this.db_self = db._self;
                this.getOrCreateCollection(this.db_self, collectionName, (col:JSON)=> {
                    this.col_self = col._self;
                    resolve()
                })
            })
        })
    }

    insertDocuments(data:Array<any>) {
        return new Promise((resolve, reject)=> {
            this._insertDocuments(data, this.col_self, ()=> {
                resolve();
            })
        })
    }


    getDocumentById(collectionLink, id, callback) {
        var querySpec = {
            query: 'SELECT * FROM Families f WHERE  f.id = @id',
            parameters: [
                {
                    name: '@id',
                    value: id
                }
            ]
        };
        this.client.queryDocuments(collectionLink, querySpec).toArray((err, results)=> {
            if (err) {
                this.handleError(err);
            }

            if (results.length === 0) {
                throw ("No document found with id matching '" + id + "'");
            } else if (results.length > 1) {
                throw ("More than one document found matching id '" + id + "'");
            } else {
                callback(results[0]);
            }
        });
    }


    _insertDocuments(data, collectionLink, callback) {
        var createdList = [];
        var counter = 0;

        this.client.createDocument(collectionLink, data, (err, created)=> {
            if (err) {
                console.log('error',err)
                this.handleError(err);
            }
            console.log('Document with id \'' + created.id + '\' created.');
            callback()
        });
    }


    getOrCreateDatabase(databaseId, callback) {
        var querySpec = {
            query: 'SELECT * FROM root r WHERE r.id=@id',
            parameters: [
                {
                    name: '@id',
                    value: databaseId
                }
            ]
        };
        this.client.queryDatabases(querySpec).toArray((err, results)=> {
            if (err) {
                this.handleError(err);
            }

            if (results.length === 0) {
                console.log('Database \'' + databaseId + '\'not found');
                var databaseDef = {id: databaseId};

                this.client.createDatabase(databaseDef, (err, created) => {
                    if (err) {
                        this.handleError(err);
                    }

                    console.log('Database \'' + databaseId + '\'created');
                    callback(created);
                });
            } else {
                console.log('Database \'' + databaseId + '\'found');
                callback(results[0]);
            }
        });
    }


    getOrCreateCollection(databaseLink, collectionId, callback) {
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
            .toArray((err, results)=> {
                if (err) {
                    this.handleError(err);
                }

                if (results.length === 0) {
                    console.log('Collection \'' + collectionId + '\'not found');
                    var collectionDef = {id: collectionId};

                    this.client.createCollection(databaseLink, collectionDef, (err, created)=> {
                        if (err) {
                            this.handleError(err);
                        }

                        console.log('Collection \'' + collectionId + '\'created');
                        callback(created);
                    });
                } else {
                    console.log('Collection \'' + collectionId + '\'found');
                    callback(results[0]);
                }
            });
    }


    deleteCollection(collection, callback) {
        this.client.deleteCollection(collection._self, (err)=> {
            if (err) {
                this.handleError(err);
            } else {
                console.log('Collection \'' + collection.id + '\'deleted');
                callback();
            }
        });
    }


    deleteDatabase(database, callback) {
        this.client.deleteDatabase(database._self, (err) => {
            if (err) {
                this.handleError(err);
            } else {
                console.log('Database \'' + database.id + '\'deleted');
                callback();
            }
        });
    }


    handleError(error) {
        console.log();
        console.log('An error with code \'' + error.code + '\' has occurred:');
        console.log('\t' + JSON.parse(error.body).message);
        console.log();
    }


}
