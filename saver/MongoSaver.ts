/**
 * Created by nicolasbahout on 02/05/15.
 */
import {MasterSaver} from './MasterSaver';
import MongoDb = require('mongodb');
import  Promise = require('bluebird');
var mongodb = Promise.promisifyAll(require('mongodb'));

var MongoClient = MongoDb.MongoClient;

export class MongoSaver extends MasterSaver {
    url;
    db;
    err;

    constructor(public database, public collectionName, config) {
        super();
        this.url = 'mongodb://' + config.host + ':' + config.port + '/' + database;
        super()
    }

    init(collectionName = this.collectionName) {
        this.collectionName = collectionName;
        return new Promise((resolve, reject)=> {
            console.log('this.url', this.url);
            return mongodb.connectAsync(this.url).then((db) => {
                console.log('Mongo init done ==>', db);
                this.db = db;
                return resolve()

            }).catch(mongodb.MongoError, function (e) {
                throw new Error('Unable to connect to database: "' + e + '"');
            });
        })
    }


    disconnect() {
        return () => {
            return new Promise((resolve, reject)=> {
                this.db.close()
            })
        }
    }


    insertDocuments(data:Array<any>) {
        return new Promise((resolve, reject)=> {
            var collection = this.db.collection(this.collectionName);
            // Insert some documents
            collection.insert(data, (err, result)=> {
                if (result) return resolve(result);
                if (err) return reject(err)
            });
        })
    }

    updateDocuments(where:JSON, data:JSON) {
        return new Promise((resolve, reject)=> {
            var collection = this.db.collection(this.collectionName);
            // Insert some documents
            collection.update({where}, {$set: data}, {upsert: true}, (err, result)=> {
                if (result) return resolve(result);
                if (err) return reject(err)
            });
        })
    }


}