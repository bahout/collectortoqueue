/**
 * Created by nicolasbahout on 02/05/15.
 */
import {MasterSaver} from './MasterSaver';
import MongoDb = require('mongodb');
import  Promise = require('bluebird');

var MongoClient = MongoDb.MongoClient;

export class MongoSaver extends MasterSaver {
    url;
    db;

    constructor(config) {
        this.url = 'mongodb://' + config.host + ':' + config.port + '/' + config.db;
        super()
    }

    init() {
        return new Promise((resolve, reject)=> {
            console.log('this.url', this.url);
            MongoClient.connect(this.url, (err, db) => {
                this.db = db;
                resolve()
            })
        })
    }


    disconnect() {
        return () => {
            return new Promise((resolve, reject)=> {
                this.db.close()
            })
        }
    }


    insertDocuments(collectionName:string, data:Array<any>) {
        return new Promise((resolve, reject)=> {
            var collection = this.db.collection(collectionName);
            // Insert some documents
            collection.insert(data, (err, result)=> {
                if (result) return resolve(result);
                if (err) return reject(err)
            });
        })
    }

    updateDocuments(collectionName:string, where:JSON, data:JSON) {
        return new Promise((resolve, reject)=> {
            var collection = this.db.collection(collectionName);
            // Insert some documents
            collection.update({where}, {$set: data}, {upsert: true}, (err, result)=> {
                if (result) return resolve(result);
                if (err) return reject(err)
            });
        })
    }


}