// -----------------------------------------
// UserLoop
// -----------------------------------------
//
var BUILD_AS_SINGLE_FILE;
if (!BUILD_AS_SINGLE_FILE) {
var util = require('../util');
var EventEmitter = require('events').EventEmitter;
var Loop = require('./loop').Loop;
var Program = require('../user/program').Program;
}

var USER_LOOP_OPTIONS = exports.USER_LOOP_OPTIONS = {
    program: undefined,
    duration: Infinity,
    numberOfTimes: Infinity,
    concurrency: 1,
    concurrencyProfile: undefined
};

var UserLoop = exports.UserLoop = function UserLoop(programOrSpec, args, conditions) {
    console.log('new user coming online');
    EventEmitter.call(this);
    if (programOrSpec === "object") {
        var spec = util.defaults(programOrSpec, USER_LOOP_OPTIONS);

        programOrSpec = spec.userProgram;
        conditions = [];
        args = spec.programArguments;

        if (spec.numberOfTimes > 0 && spec.numberOfTimes < Infinity) {
            conditions.push(UserLoop.maxExecutions(spec.numberOfTimes));
        }
        if (spec.duration > 0 && spec.duration < Infinity) {
            conditions.push(UserLoop.timeLimit(spec.duration));
        }
    }

    this.id = util.uid();
    this.programFn = programOrSpec;
    this.programArgs = args;
    this.restartProgram();
    this.conditions = conditions || [];
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

UserLoop.prototype.restartProgram = function() {
    this.program = new Program(this.programFn, this.programArgs);
};

/** Checks conditions and schedules the next loop iteration. 'startiteration' is emitted before each
iteration and 'enditeration' is emitted after. */
UserLoop.prototype.loop_ = function() {

    var self = this, result, active,
        callfun = function() {
            result = null; active = true;
            if (self.program.finished()) {
                self.restartProgram();
            }

            var isRequest = self.program.pendingIsRequest();
            if (isRequest) {
                self.emit('startiteration');
            }
            self.program.next(function(res) {
                if (isRequest) {
                    console.log('e');
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
