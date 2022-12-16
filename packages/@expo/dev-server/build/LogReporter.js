"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function _serializeError() {
  const data = require("serialize-error");
  _serializeError = function () {
    return data;
  };
  return data;
}
class LogReporter {
  constructor(logger, reportEvent = () => {}) {
    this.logger = logger;
    this.reportEvent = reportEvent;
    this.logger = logger;
    this.reportEvent = reportEvent;
  }
  update(event) {
    if (event.error instanceof Error) {
      event.error = (0, _serializeError().serializeError)(event.error);
    }
    // TODO(ville): replace xdl.PackagerLogsStream with a reporter to avoid serializing to JSON.
    this.logger.info({
      tag: 'metro'
    }, JSON.stringify(event));
    this.reportEvent(event);
  }
}
exports.default = LogReporter;
//# sourceMappingURL=LogReporter.js.map