var consumer = require('./consumer');
var producer = require('./producer');
import {Ui2} from './ui/kue-ui';


var methods = {
    consumer: consumer,
    producer: producer,
    ui: Ui2,

};


Object.defineProperty(methods, 'myConf', {
    get: function () {
        return consumer.myConf || producer.myConf
    }
});

module.exports = methods;
