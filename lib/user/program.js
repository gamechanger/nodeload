var BUILD_AS_SINGLE_FILE;
if (BUILD_AS_SINGLE_FILE === undefined) {
var util = require('../util');
}

var Program = exports.Program = function(fun) {
    this._plan = [];
    this.runData = {};
    this.attrs = util.extend({}, Program.default_attrs);
    fun(this);
};

// Registration

Program.interpreters = {}
Program.default_attrs = {}

Program.registerInterpreter = function(type, interpreter, argsFn) {
    if (!argsFn) {
        argsFn = function() {
            return Array.prototype.slice.call(arguments);
        }
    }
    Program.prototype[type] = function() {
        return this.addStep(type, argsFn.apply(this, arguments));
    };
    Program.interpreters[type] = interpreter;
};

Program.registerHelper = function(name, type, argsFn) {
    Program.prototype[name] = function() {
        return this[type].apply(this, argsFn.apply(this, arguments));
    };
}

Program.registerAttrHelper = function(name, fn, defaults) {
    Program.prototype[name] = function() {
        util.extend(this.attrs, fn.apply(this, arguments));
        return this;
    };
    if (defaults) {
        util.extend(Program.default_attrs, defaults);
    }
};

// Planning

Program.prototype.addStep = function(type, args) {
    this._plan.push({type: type, args: args});
    return this;
};

// Execution

// This needs to be special-cased since executors need to recognize waits
Program.prototype.willWait = function() {
    return !this.finished() && this._plan[0].type == 'wait';
};

Program.prototype.next = function(cb) {
    var nextStep = this._plan.shift();
    nextStep.args.push(cb);
    var interpreter = Program.interpreters[nextStep.type];
    return interpreter.apply(this, nextStep.args);
};

Program.prototype.finished = function() {
    return this._plan.length === 0;
}

// We always want "wait"
Program.registerInterpreter('wait', function(duration, cb) {
    setTimeout(cb, duration)
});
