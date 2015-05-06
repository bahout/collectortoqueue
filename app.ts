/**
 * Created by nicolasbahout on 02/05/15.
 */


import {GetSqlData} from './collector/GetSqlData';
import {GetMongoData} from './collector/GetMongoData';
import {GetTxtData} from './collector/GetTxtData';
import {JobKue} from './job/JobKue';
import {MongoSaver} from './saver/MongoSaver'
import {DocumentDbSaver} from './saver/DocumentDbSaver'

import {Ui} from './ui/ui';
import {Ui2} from './ui/kue-ui';


module.exports = {
    GetSqlData: GetSqlData,
    GetTxtData: GetTxtData,
    GetMongoData: GetMongoData,
    JobKue: JobKue,
    MongoSaver: MongoSaver,
    DocumentDbSaver: DocumentDbSaver,
    Ui: Ui,
    Ui2: Ui2

};