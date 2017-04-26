'use strict';
var delay = require('delay');
var expect = require('chai').expect;

module.exports = eventually;
eventually.Assertion = Assertion;

/**
 * This provides functionality in the test to wait and evaluate the function periodically
 * until some maximum timeout. It expects the function to be a generator function.
 */
function eventually(fn, checkInterval, duration) {
    return new Assertion(fn, checkInterval, duration)
}

function Assertion(fn, checkInterval, duration) {
    this.fn = fn;
    this.checkInterval = checkInterval;
    this.duration = duration;
    expect(duration).to.be.above(checkInterval)
    this.should = this;
}

Assertion.prototype.equal = function*(val, msg) {
    var count = Math.floor(this.duration / this.checkInterval);
    for (var i = 0; i < count; i++) {
        yield delay(this.checkInterval);
        process.stdout.write('.');
        var actual = yield this.fn();
        if (actual === val) {
            break;
        }
    }
    expect(actual).to.be.equal(val);
}