var consumer = require('./consumer');
var producer = require('./producer');
var remover = require('./remover');
import {Ui2} from './ui/kue-ui';


var methods = {
    consumer: consumer,
    producer: producer,
    remover: remover,
    ui: Ui2,

};


Object.defineProperty(methods, 'myConf', {
    get: function () {
        return consumer.myConf || producer.myConf || remover.myConf
    }
});

module.exports = methods;
