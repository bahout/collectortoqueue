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



Object.defineProperty(global, '__stack', {
    get: function() {
        var orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function(_, stack) {
            return stack;
        };
        var err = new Error;
        Error.captureStackTrace(err, arguments.callee);
        var stack = err.stack;
        Error.prepareStackTrace = orig;
        return stack;
    }
});

Object.defineProperty(global, '__line', {
    get: function() {
        return __stack[1].getLineNumber();
    }
});

Object.defineProperty(global, '__function', {
    get: function() {
        return __stack[1].getFunctionName();
    }
});

Object.defineProperty(global, '__function2', {
    get: function() {
        return __stack[2].getFunctionName();
    }
});
