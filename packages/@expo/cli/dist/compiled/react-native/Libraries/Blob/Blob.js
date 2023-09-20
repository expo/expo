'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var Blob = function () {
  function Blob() {
    var parts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var options = arguments.length > 1 ? arguments[1] : undefined;
    (0, _classCallCheck2.default)(this, Blob);
    var BlobManager = require('./BlobManager');
    this.data = BlobManager.createFromParts(parts, options).data;
  }
  (0, _createClass2.default)(Blob, [{
    key: "data",
    get: function get() {
      if (!this._data) {
        throw new Error('Blob has been closed and is no longer available');
      }
      return this._data;
    },
    set: function set(data) {
      this._data = data;
    }
  }, {
    key: "slice",
    value: function slice(start, end) {
      var BlobManager = require('./BlobManager');
      var _this$data = this.data,
        offset = _this$data.offset,
        size = _this$data.size;
      if (typeof start === 'number') {
        if (start > size) {
          start = size;
        }
        offset += start;
        size -= start;
        if (typeof end === 'number') {
          if (end < 0) {
            end = this.size + end;
          }
          if (end > this.size) {
            end = this.size;
          }
          size = end - start;
        }
      }
      return BlobManager.createFromOptions({
        blobId: this.data.blobId,
        offset: offset,
        size: size,
        __collector: this.data.__collector
      });
    }
  }, {
    key: "close",
    value: function close() {
      var BlobManager = require('./BlobManager');
      BlobManager.release(this.data.blobId);
      this.data = null;
    }
  }, {
    key: "size",
    get: function get() {
      return this.data.size;
    }
  }, {
    key: "type",
    get: function get() {
      return this.data.type || '';
    }
  }]);
  return Blob;
}();
module.exports = Blob;
//# sourceMappingURL=Blob.js.map