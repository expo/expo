Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RawPerformanceEntryTypeValues = void 0;
exports.performanceEntryTypeToRaw = performanceEntryTypeToRaw;
exports.rawToPerformanceEntry = rawToPerformanceEntry;
exports.rawToPerformanceEntryType = rawToPerformanceEntryType;
var _PerformanceEntry = require("./PerformanceEntry");
var _PerformanceEventTiming = require("./PerformanceEventTiming");
var RawPerformanceEntryTypeValues = {
  UNDEFINED: 0,
  MARK: 1,
  MEASURE: 2,
  EVENT: 3
};
exports.RawPerformanceEntryTypeValues = RawPerformanceEntryTypeValues;
function rawToPerformanceEntry(entry) {
  if (entry.entryType === RawPerformanceEntryTypeValues.EVENT) {
    return new _PerformanceEventTiming.PerformanceEventTiming({
      name: entry.name,
      startTime: entry.startTime,
      duration: entry.duration,
      processingStart: entry.processingStart,
      processingEnd: entry.processingEnd,
      interactionId: entry.interactionId
    });
  } else {
    return new _PerformanceEntry.PerformanceEntry({
      name: entry.name,
      entryType: rawToPerformanceEntryType(entry.entryType),
      startTime: entry.startTime,
      duration: entry.duration
    });
  }
}
function rawToPerformanceEntryType(type) {
  switch (type) {
    case RawPerformanceEntryTypeValues.MARK:
      return 'mark';
    case RawPerformanceEntryTypeValues.MEASURE:
      return 'measure';
    case RawPerformanceEntryTypeValues.EVENT:
      return 'event';
    case RawPerformanceEntryTypeValues.UNDEFINED:
      throw new TypeError("rawToPerformanceEntryType: UNDEFINED can't be cast to PerformanceEntryType");
    default:
      throw new TypeError(`rawToPerformanceEntryType: unexpected performance entry type received: ${type}`);
  }
}
function performanceEntryTypeToRaw(type) {
  switch (type) {
    case 'mark':
      return RawPerformanceEntryTypeValues.MARK;
    case 'measure':
      return RawPerformanceEntryTypeValues.MEASURE;
    case 'event':
      return RawPerformanceEntryTypeValues.EVENT;
    default:
      type;
      throw new TypeError(`performanceEntryTypeToRaw: unexpected performance entry type received: ${type}`);
  }
}
//# sourceMappingURL=RawPerformanceEntry.js.map