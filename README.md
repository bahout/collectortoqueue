# collectortoqueue
This library is in alpha. We will make an effort to support the library, but we reserve the right to make incompatible changes when necessary.



It is a task Manager based on Kue. (node.js)

The goal of library collectortoqueue is a library to manage task with kue (node.js)


It is composed with 3 parts:

1) Collector : collect data from source (database, Mongo, Mysql, Redis, text file or array)
2) TaskManager : Do Something with data
3) Saver : Save Data Somewhere (Mongo, MySql, Redis, ...)


## Example
In file producer.js
 ```
    //define the source of data
    var collector = new ctq.GetSqlData('database', 'table', config.mysql);
    collector.filter = "WHERE site_internet<>''";
    collector.start = 0;
    collector.size = 5000;
    
     //prepare data to be send in kue
     var jobMaster = new ctq.JobKue(config.redis, collector);
     //nb of job send in the same time
     jobMaster.type = 'url';
     
     //run : the database in send in the redis kue by groupe of 5000.
     jobMaster
             .init()
             .then(jobMaster.exec())
             .then(function () {
                 console.log('====================== all task has been executed ======================');
             })
             .catch(function (e) {
                 console.log(e)
             });
     
```


### 1 collector
The collector collect data from source (database, text file or array)

### 2 TaskManager

### 3 Saver save data in location (Mongo, MySql, Redis, ...)


## example of collector in this module

Txt file
MySql
Mongo

