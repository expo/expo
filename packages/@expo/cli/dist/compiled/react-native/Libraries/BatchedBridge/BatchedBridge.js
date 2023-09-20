'use strict';

var MessageQueue = require("./MessageQueue");
var BatchedBridge = new MessageQueue();
Object.defineProperty(global, '__fbBatchedBridge', {
  configurable: true,
  value: BatchedBridge
});
module.exports = BatchedBridge;
//# sourceMappingURL=BatchedBridge.js.map