var consumer = require('./consumer');
var producer = require('./producer');
var kue_ui_1 = require('./ui/kue-ui');
var methods = {
    consumer: consumer,
    producer: producer,
    ui: kue_ui_1.Ui2,
};
Object.defineProperty(methods, 'myConf', {
    get: function () {
        return consumer.myConf || producer.myConf;
    }
});
module.exports = methods;
//# sourceMappingURL=app.js.map