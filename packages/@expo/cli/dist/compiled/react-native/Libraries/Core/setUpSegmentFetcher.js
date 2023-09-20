'use strict';

function __fetchSegment(segmentId, options, callback) {
  var SegmentFetcher = require("./SegmentFetcher/NativeSegmentFetcher").default;
  SegmentFetcher.fetchSegment(segmentId, options, function (errorObject) {
    if (errorObject) {
      var error = new Error(errorObject.message);
      error.code = errorObject.code;
      callback(error);
    }
    callback(null);
  });
}
global.__fetchSegment = __fetchSegment;
//# sourceMappingURL=setUpSegmentFetcher.js.map