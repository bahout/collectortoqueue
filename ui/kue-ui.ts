/**
 * Created by nicolasbahout on 01/05/15.
 */
var kue = require('kue');
var express = require('express');
var ui = require('kue-ui');
var app = express();

export class Ui2 {
    port;

    constructor(redisconf, port = 3001) {
        //console.log(redisconf);
        kue.createQueue({redis: redisconf});

        ui.setup({
            apiURL: '/api', // IMPORTANT: specify the api url
            baseURL: '/kue', // IMPORTANT: specify the base url
            updateInterval: 1000 // Optional: Fetches new data every 5000 ms
        });

// Mount kue JSON api
        app.use('/api', kue.app);
// Mount UI
        app.use('/kue', ui.app);

        app.listen(port);
        console.log('\n===> server is running\nOpen your navigation in: http://yourHost:' + port + '/kue'+'\n')

    }
}
