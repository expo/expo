'use strict';
function assert(value, message) {
  if (!value) {
    const e = new Error(message || 'Assertion failed');
    e.code = 'ERR_ASSERTION';
    throw e;
  }
}
assert.ok = assert;
assert.equal = (a, b, m) => assert(a == b, m || a + ' == ' + b);
assert.strictEqual = (a, b, m) => assert(a === b, m || a + ' === ' + b);
assert.notEqual = (a, b, m) => assert(a != b, m);
assert.notStrictEqual = (a, b, m) => assert(a !== b, m);
assert.deepEqual = assert.deepStrictEqual = (a, b, m) => assert(JSON.stringify(a) === JSON.stringify(b), m);
assert.fail = (m) => assert(false, m || 'Failed');
assert.throws = (fn, _e, m) => { try { fn(); } catch { return; } assert(false, m || 'Missing expected exception'); };
assert.strict = assert;
assert.AssertionError = Error;
module.exports = assert;
