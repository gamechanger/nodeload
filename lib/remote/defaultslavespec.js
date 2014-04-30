var BUILD_AS_SINGLE_FILE;
if (!BUILD_AS_SINGLE_FILE) {
var util = require('../util');
var qputs = util.qputs;
}

exports.setup = function() {
    if (typeof BUILD_AS_SINGLE_FILE === 'undefined' || BUILD_AS_SINGLE_FILE === false) {
        this.nlrun = require('../loadtesting').run;
    } else {
        this.nlrun = run;
    }
}

exports.runTests = function(master, specsStr) {
    var specs;
    try {
        // TODO: use command line option to provide path file/directory
        // containing the code, instead of doing eval.
        eval('specs='+specsStr);
    } catch(e) {
        qputs('WARN: Ignoring invalid remote test specifications: ' + specsStr + ' - ' + e.toString());
        return;
    }

    if (this.state === 'running') {
        qputs('WARN: Already running -- ignoring new test specifications: ' + specsStr);
        return;
    }

    qputs('Received remote test specifications: ' + specsStr);

    var self = this;
    self.state = 'running';
    self.loadtest = self.nlrun(specs);
    self.loadtest.keepAlive = true;
    self.loadtest.on('update', function(interval, stats) {
        master.sendStats(interval);
    });
    self.loadtest.on('end', function() {
        self.state = 'done';
    });
}

exports.stopTests = function(master) {
    if (this.loadtest) { this.loadtest.stop(); }
}
