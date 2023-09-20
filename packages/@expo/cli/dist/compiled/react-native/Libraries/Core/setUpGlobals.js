'use strict';
if (global.window === undefined) {
  global.window = global;
}
if (global.self === undefined) {
  global.self = global;
}
global.process = global.process || {};
global.process.env = global.process.env || {};
if (!global.process.env.NODE_ENV) {
  global.process.env.NODE_ENV = __DEV__ ? 'development' : 'production';
}
//# sourceMappingURL=setUpGlobals.js.map