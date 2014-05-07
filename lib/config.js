// ------------------------------------
// Nodeload configuration
// ------------------------------------
//
// The functions in this file control the behavior of the nodeload globals, like HTTP_SERVER and
// REPORT_MANAGER. They should be called when the library is included:
//
//      var nl = require('./lib/nodeload').quiet().usePort(10000);
//      nl.runTest(...);
//
// Or, when using individual modules:
//
//      var nlconfig = require('./lib/config').quiet().usePort(10000);
//      var reporting = require('./lib/reporting');
//
var BUILD_AS_SINGLE_FILE, NODELOAD_CONFIG;
if (!BUILD_AS_SINGLE_FILE) {
var EventEmitter = require('events').EventEmitter;
}

/** Suppress all console output */
exports.quiet = function() {
    NODELOAD_CONFIG.QUIET = true;
    return exports;
};

/** Start the nodeload HTTP server on the given port */
exports.usePort = function(port) {
    NODELOAD_CONFIG.HTTP_PORT = port;
    return exports;
};

/** Do not start the nodeload HTTP server */
exports.disableServer = function() {
    NODELOAD_CONFIG.HTTP_ENABLED = false;
    return exports;
};

/** Set the default number of milliseconds between 'update' events from a LoadTest created by run(). */
exports.setMonitorIntervalMs = function(milliseconds) {
    NODELOAD_CONFIG.MONITOR_INTERVAL_MS = milliseconds;
    return exports;
};

/** Set the number of milliseconds between auto-refreshes for the summary webpage */
exports.setAjaxRefreshIntervalMs = function(milliseconds) {
    NODELOAD_CONFIG.AJAX_REFRESH_INTERVAL_MS = milliseconds;
    return exports;
};

/** Do not write any logs to disk */
exports.disableLogs = function() {
    NODELOAD_CONFIG.LOGS_ENABLED = false;
    return exports;
};

/** Set the number of milliseconds between pinging slaves when running distributed load tests */
exports.setSlaveUpdateIntervalMs = function(milliseconds) {
    NODELOAD_CONFIG.SLAVE_UPDATE_INTERVAL_MS = milliseconds;
};

// =================
// Singletons
// =================

var NODELOAD_CONFIG = exports.NODELOAD_CONFIG = {
    START: new Date(),

    QUIET: Boolean(process.env.QUIET) || false,

    HTTP_ENABLED: true,
    HTTP_PORT: Number(process.env.HTTP_PORT) || 8000,

    MONITOR_INTERVAL_MS: 2000,

    AJAX_REFRESH_INTERVAL_MS: 2000,

    LOGS_ENABLED: process.env.LOGS ? process.env.LOGS !== '0' : true,

    SLAVE_UPDATE_INTERVAL_MS: 3000,

    SLAVE_SPECIFICATIONS: process.env.SLAVE_SPECIFICATIONS || null,

    eventEmitter: new EventEmitter(),
    on: function(event, fun) {
        this.eventEmitter.on(event, fun);
    },
    apply: function() {
        this.eventEmitter.emit('apply');
    }
};

process.nextTick(function() { NODELOAD_CONFIG.apply(); });
