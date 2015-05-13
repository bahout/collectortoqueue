# collectortoqueue
This library is in alpha. We will make an effort to support the library, but we reserve the right to make incompatible changes when necessary.

It is a distributed task Manager based on Kue. (node.js)

The goal of library collectortoqueue is a library to manage task with kue (node.js)


It is composed with 3 parts:

1) Collector : collect data from source (database, Mongo, Mysql, Redis, text file or array)
2) TaskManager : Do Something with data
3) Saver : Save Data Somewhere (Mongo, MySql, Redis, ...)


## Simple Example

We create 2 files :
 - produce.js : for produce task.
 - consume.js : for compute tasks. Comsume.js can be deploy in a large number of machine or VM. The task has process 
 
###Create file producer.js
 ```
 
    //define the source of data (here mysql)
    var collector = new ctq.GetSqlData('database', 'table', config.mysql);
    
    //prepare data to be send in kue
    var jobMaster = new ctq.JobKue(config.redis, collector);
   
    //run : the database in send in the redis kue by groupe of 5000.
    jobMaster
             .init()
             .then(jobMaster.exec())
             .then(function () {
                 console.log('====================== all task has been send to Kue ======================');
             })
             .catch(function (e) {
                 console.log(e)
             });
     
```


## More complexe Example
In file producer.js
 ```
 
    //define the source of data
    var collector = new ctq.GetSqlData('myDatabase', 'emails', config.mysql);
    
    //we don't want to collect every thing we add a filter
    collector.filter = "WHERE email<>''";
    //it means we start by row 0
    collector.start = 0;
    //it mean we collect 5000 rows each time
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
                 console.log('====================== all task has been send to Kue ======================');
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

