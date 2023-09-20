'use strict';

var JSInspector = {
  registerAgent: function registerAgent(type) {
    if (global.__registerInspectorAgent) {
      global.__registerInspectorAgent(type);
    }
  },
  getTimestamp: function getTimestamp() {
    return global.__inspectorTimestamp();
  }
};
module.exports = JSInspector;
//# sourceMappingURL=JSInspector.js.map