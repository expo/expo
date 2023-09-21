var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _NativeJSCHeapCapture = _interopRequireDefault(require("./NativeJSCHeapCapture"));
var HeapCapture = {
  captureHeap: function captureHeap(path) {
    var error = null;
    try {
      global.nativeCaptureHeap(path);
      console.log('HeapCapture.captureHeap succeeded: ' + path);
    } catch (e) {
      console.log('HeapCapture.captureHeap error: ' + e.toString());
      error = e.toString();
    }
    if (_NativeJSCHeapCapture.default) {
      _NativeJSCHeapCapture.default.captureComplete(path, error);
    }
  }
};
module.exports = HeapCapture;