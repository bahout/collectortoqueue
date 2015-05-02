var kue = require('kue');
//queue create
var Ui = (function () {
    function Ui(redisconf, port) {
        if (port === void 0) { port = 3000; }
        var jobs = kue.createQueue({ redis: redisconf });
        kue.app.listen(port);
        console.log('server is running in port ' + port);
    }
    return Ui;
})();
exports.Ui = Ui;
//# sourceMappingURL=ui.js.map