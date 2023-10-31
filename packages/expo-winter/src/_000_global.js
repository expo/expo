const global = new Function('return this')();

var process = this.process || {};

// Add window and self to global.
global.window ||= global;
global.self ||= global;

process.env = process.env || {};

// TODO: This must be set before `react` builtin is loaded.
globalThis.setImmediate ||= function () {};
