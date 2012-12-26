var http = require('http');

var BUILD_AS_SINGLE_FILE;
if (BUILD_AS_SINGLE_FILE === undefined) {
var Program = require('./program').Program;
}

var registerHttp = exports.registerHttp = function() {
    Program.registerAttrHelper('host', function(hostname, port) {
        var settings = {hostname: hostname};
        if (port) {
            settings.port = port;
        }
        return settings;
    }, {hostname: 'localhost', port: 80});

    Program.registerInterpreter('request', function(options, cb) {
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
    }, function(options) {
        options.hostname = options.hostname || this.attrs.hostname;
        options.port = options.port || this.attrs.port;
        return [options];
    });

    Program.registerHelper('get', 'request', function(path, options) {
        options = options || {};
        options.method = 'GET';
        options.path = path;
        return [options];
    });

    Program.registerHelper('post', 'request', function(path, data, options) {
        options = options || {};
        options.method = 'POST';
        options.path = path;
        options.data = data;
        return [options];
    });
};
