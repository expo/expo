'use strict';

var AUTO_SET_TIMESTAMP = -1;
var DUMMY_INSTANCE_KEY = 0;
var QuickPerformanceLogger = {
  markerStart: function markerStart(markerId) {
    var instanceKey = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DUMMY_INSTANCE_KEY;
    var timestamp = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : AUTO_SET_TIMESTAMP;
    if (global.nativeQPLMarkerStart) {
      global.nativeQPLMarkerStart(markerId, instanceKey, timestamp);
    }
  },
  markerEnd: function markerEnd(markerId, actionId) {
    var instanceKey = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : DUMMY_INSTANCE_KEY;
    var timestamp = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : AUTO_SET_TIMESTAMP;
    if (global.nativeQPLMarkerEnd) {
      global.nativeQPLMarkerEnd(markerId, instanceKey, actionId, timestamp);
    }
  },
  markerTag: function markerTag(markerId, tag) {
    var instanceKey = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : DUMMY_INSTANCE_KEY;
    if (global.nativeQPLMarkerTag) {
      global.nativeQPLMarkerTag(markerId, instanceKey, tag);
    }
  },
  markerAnnotate: function markerAnnotate(markerId, annotations) {
    var instanceKey = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : DUMMY_INSTANCE_KEY;
    if (global.nativeQPLMarkerAnnotateWithMap) {
      global.nativeQPLMarkerAnnotateWithMap(markerId, annotations, instanceKey);
    } else if (global.nativeQPLMarkerAnnotate) {
      for (var type of ['string', 'int', 'double', 'bool', 'string_array', 'int_array', 'double_array', 'bool_array']) {
        var keyValsOfType = annotations[type];
        if (keyValsOfType != null) {
          for (var annotationKey of Object.keys(keyValsOfType)) {
            global.nativeQPLMarkerAnnotate(markerId, instanceKey, annotationKey, keyValsOfType[annotationKey].toString());
          }
        }
      }
    }
  },
  markerCancel: function markerCancel(markerId) {
    var instanceKey = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DUMMY_INSTANCE_KEY;
    this.markerDrop(markerId, instanceKey);
  },
  markerPoint: function markerPoint(markerId, name) {
    var instanceKey = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : DUMMY_INSTANCE_KEY;
    var timestamp = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : AUTO_SET_TIMESTAMP;
    var data = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
    if (global.nativeQPLMarkerPoint) {
      global.nativeQPLMarkerPoint(markerId, name, instanceKey, timestamp, data);
    }
  },
  markerDrop: function markerDrop(markerId) {
    var instanceKey = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DUMMY_INSTANCE_KEY;
    if (global.nativeQPLMarkerDrop) {
      global.nativeQPLMarkerDrop(markerId, instanceKey);
    }
  },
  markEvent: function markEvent(markerId, type) {
    var annotations = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    if (global.nativeQPLMarkEvent) {
      global.nativeQPLMarkEvent(markerId, type, annotations);
    }
  },
  currentTimestamp: function currentTimestamp() {
    if (global.nativeQPLTimestamp) {
      return global.nativeQPLTimestamp();
    }
    return 0;
  }
};
module.exports = QuickPerformanceLogger;
//# sourceMappingURL=QuickPerformanceLogger.js.map