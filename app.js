var consumer = require('./consumer');
var producer = require('./producer');
var remover = require('./remover');
var kue_ui_1 = require('./ui/kue-ui');
var methods = {
    consumer: consumer,
    producer: producer,
    remover: remover,
    ui: kue_ui_1.Ui2,
};
Object.defineProperty(methods, 'myConf', {
    get: function () {
        return consumer.myConf || producer.myConf || remover.myConf;
    }
});
module.exports = methods;
//# sourceMappingURL=app.js.map