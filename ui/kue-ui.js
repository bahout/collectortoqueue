/**
 * Created by nicolasbahout on 01/05/15.
 */
var kue = require('kue');
var express = require('express');
var ui = require('kue-ui');
var app = express();
var Ui2 = (function () {
    function Ui2(redisconf, port) {
        if (port === void 0) { port = 3001; }
        kue.createQueue({ redis: redisconf.redis });
        ui.setup({
            apiURL: '/api',
            baseURL: '/kue',
            updateInterval: 1000 // Optional: Fetches new data every 5000 ms
        });
        // Mount kue JSON api
        app.use('/api', kue.app);
        // Mount UI
        app.use('/kue', ui.app);
        app.listen(port);
        console.log('\n===> server is running\nOpen your navigation in: http://yourHost:' + port + '/kue' + '\n');
    }
    return Ui2;
})();
exports.Ui2 = Ui2;
//# sourceMappingURL=kue-ui.js.map