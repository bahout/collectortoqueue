var kue = require('kue');

//queue create

export class Ui {
    port;

    constructor(redisconf, port = 3000) {
        var jobs = kue.createQueue({redis: redisconf});

        kue.app.listen(port);
        console.log('server is running in port ' + port)
    }
}




