var http = require('http');
var util = require('util');

var DEFAULT_ATTRS = {hostname: 'localhost',
                     port: 80};

var Program = exports.Program = function(fun) {
    this._plan = [];
    this.attrs = util.extend({}, DEFAULT_ATTRS);
    fun(this);
};

Program.prototype.addStep = function(type, args) {
    this._plan.push({type: type, args: args});
    return this;
};

Program.prototype.setAttribute = function(name, value) {
    this.attrs[name] = value;
}

Program.prototype.host = function(hostname, port) {
    this.attrs.hostname = hostname;
    if (port) {
        this.attrs.port = port;
    }
}

Program.prototype.wait = function(duration) {
    return this.addStep('wait', [duration])
};

Program.prototype.request = function(options) {
    options.hostname = options.hostname || this.attrs.hostname;
    options.port = options.port || this.attrs.port;
    return this.addStep('request', [options]);
};

Program.prototype.get = function(path, options) {
    options = options || {};
    options.method = 'GET';
    options.path = path;
    return this.request(options);
}

Program.prototype.post = function(path, data, options) {
    options = options || {};
    options.method = 'POST';
    options.path = path;
    options.data = data;
    return this.request(options);
}

Program.prototype.init = function(args) {
    this.args = args;
}

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
    if (options.data) {
        if (typeof options.data === 'object') {
            options.data = JSON.stringify(options.data);
        }
        req.write(options.data);
    }
    req.end();
}
