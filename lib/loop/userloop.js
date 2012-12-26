// -----------------------------------------
// UserLoop
// -----------------------------------------
//
var BUILD_AS_SINGLE_FILE;
if (!BUILD_AS_SINGLE_FILE) {
var util = require('../util');
var EventEmitter = require('events').EventEmitter;
var Loop = require('./loop').Loop;
var Program = require('./program').Program;
}

var USER_LOOP_OPTIONS = exports.USER_LOOP_OPTIONS = {
    program: undefined,
    duration: Infinity,
    numberOfTimes: Infinity,
    concurrency: 1,
    concurrencyProfile: undefined,
};

var UserLoop = exports.UserLoop = function UserLoop(programOrSpec, conditions) {
    console.log('new user coming online');
    EventEmitter.call(this);
    if (typeof programOrSpec === "object") {
        var spec = util.defaults(programOrSpec, USER_LOOP_OPTIONS);

        programOrSpec = spec.userProgram;
        conditions = [];

        if (spec.numberOfTimes > 0 && spec.numberOfTimes < Infinity) {
            conditions.push(UserLoop.maxExecutions(spec.numberOfTimes));
        }
        if (spec.duration > 0 && spec.duration < Infinity) {
            conditions.push(UserLoop.timeLimit(spec.duration));
        }
    }

    this.id = util.uid();
    this.program = new Program(programOrSpec);

    this.conditions = conditions || [];
    this.conditions.push(function() {return !this.programFinished();});
    this.running = false;
};

util.inherits(UserLoop, Loop);

/** Start executing this.fun until any condition in this.conditions
returns false. When the loop completes the 'end' event is emitted. */
UserLoop.prototype.start = function() {
    var self = this,
        startLoop = function() {
            self.emit('start');
            self.loop_();
        };

    if (self.running) { return; }
    self.running = true;
    process.nextTick(startLoop);
    return this;
};

UserLoop.prototype.stop = function() {
    this.running = false;
};


/** Checks conditions and schedules the next loop iteration. 'startiteration' is emitted before each
iteration and 'enditeration' is emitted after. */
UserLoop.prototype.loop_ = function() {

    var self = this, result, active,
        callfun = function() {
            result = null; active = true;
            var waiting = self.program.willWait();
            if (!waiting) {
                self.emit('startiteration');
            }
            self.program.next(function(res) {
                if (!waiting) {
                    self.emit('enditeration', res);
                }
                self.loop_();
            });
        };

    if (self.checkConditions_()) {
        process.nextTick(callfun);
    } else {
        self.running = false;
        self.emit('end');
    }
};

UserLoop.prototype.programFinished = function() {
    return this.program.finished();
}
