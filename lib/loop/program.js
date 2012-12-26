http = require('http');

var Program = exports.Program = function(fun) {
    this._plan = [];
    fun(this);
};

Program.prototype.addStep = function(type, args) {
    this._plan.push({type: type, args: args});
    return this;
};

Program.prototype.wait = function(duration) {
    return this.addStep('wait', [duration])
};

Program.prototype.request = function(options) {
    return this.addStep('request', [options]);
};

Program.prototype.finished = function() {
    return this._plan.length === 0;
}

Program.prototype.willWait = function() {
    return !this.finished() && this._plan[0].type == 'wait';
}

Program.prototype.next = function(cb) {
    var nextStep = this._plan.shift();
    nextStep.args.push(cb);
    return {
        wait: this.execWait,
        request: this.execRequest
    }[nextStep.type].apply(this, nextStep.args);
}

Program.prototype.execWait = function(duration, cb) {
    setTimeout(cb, duration);
};

Program.prototype.execRequest = function(options, cb) {
    var req = http.request(options, function(res) {
        cb({req: req, res: res});
    });
    req.end();
}
