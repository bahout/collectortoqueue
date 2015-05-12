# collectortoqueue

It is a task Manager based on Kue. (node.js)

The goal of library collectortoqueue is a library to manage task with kue (node.js)


It is composed with 3 parts:

1) Collector : collect data from source (database, Mongo, Mysql, Redis, text file or array)
2) TaskManager : Do Something with data
3) Saver : Save Data Somewhere (Mongo, MySql, Redis, ...)


## Example
 ```
   //define the source of data
    var collector = new ctq.GetSqlData('prestaleads', 'users', config.mysql);
    collector.filter = "WHERE site_internet<>''";
    collector.start = 0;
```


### 1 collector
The collector collect data from source (database, text file or array)

### 2 TaskManager

### 3 Saver save data in location (Mongo, MySql, Redis, ...)


## example of collector in this module

Txt file
MySql
Mongo

