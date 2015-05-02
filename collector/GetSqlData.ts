/**
 * Created by nicolasbahout on 26/04/15.
 */

import mysql = require('mysql');
import  Promise = require('bluebird');
import _ = require('lodash');
import {GetDataMaster} from './GetDataMaster';


Promise.promisifyAll(require('mysql/lib/Pool').prototype);
Promise.promisifyAll(require('mysql/lib/Connection').prototype);


export class GetSqlData extends GetDataMaster {
    pool;
    db;
    data = [];
    name;
    rows:Array<any>;
    nbElements:number;
    mysqlCount:string;
    mysqlQuery:string;
    start = 0;


    constructor(public database, public table, configMySql) {
        super();
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


    init() {
        return new Promise((resolve, reject)=> {
            this.pool.getConnectionAsync()
                .then((db) => {
                    this.db = db;
                    resolve();
                })
        })
    }


    countElement() {
        return ()=> {
            return new Promise((resolve, reject)=> {
                if (this.db) {
                    this.getElement(this.mysqlCount)
                        .then(()=> {
                            this.nbElements = this.rows[0]['count(*)'];
                            console.log('this.nbElements ', this.nbElements);
                            resolve()
                        })
                } else {

                }
            })
        }
    }

    mysqlExpression() {
        return new Promise((resolve, reject)=> {
            this.mysqlQuery = 'SELECT * FROM ' + this.table + ' ' + this.filter + ' LIMIT ' + this.start + ',' + this.concurrency;
            console.log(this.mysqlQuery);
            this.getElement(this.mysqlQuery)
                .then(()=> {
                    //console.log(this.getElement, this.rows);
                    this.data = this.data = this.rows;
                    //console.log('this.rows ', _(this.rows).pluck('id').value());
                    resolve()
                })

        })
    }

    getElement(sqlExpression) {
        return new Promise((resolve, reject)=> {
            this.db.queryAsync(sqlExpression)
                .spread((rows, columns)=> {
                    this.rows = rows;
                    resolve()
                });
        })

    }

    getData(nbmessage = 1) {
        return ()=> {
            return new Promise((resolve, reject)=> {
                this.mysqlExpression()
                    .then(()=> {
                        resolve()
                    });
                this.start = this.concurrency + this.start;

            })
        }
    }


    deleteOneData(job) {
        return ()=> {
            return new Promise((resolve, reject)=> {
                //console.log('deleteMessage in', job.messagetext);
                if (!job) return reject('job is require for deleteMessage(id)');

                this.data = _(this.data)
                    .map(function (currentObject) {
                        //console.log('currentObject.id === job.id', currentObject.id === job.id);
                        if (currentObject.id != job.id) {
                            return currentObject
                        }
                    })
                    .compact()
                    .value();

                //console.log('Kue.messages after remove  ==>', this.data);

                resolve();
                // Message deleted

            });
        }
    }


    disconnect() {
        return () => {
            return new Promise((resolve, reject)=> {
                this.pool.end(function (err) {
                    // The connection is terminated now
                });
            })
        }
    }

}


