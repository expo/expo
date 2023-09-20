var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _NativeBlobModule = _interopRequireDefault(require("./NativeBlobModule"));
var _invariant = _interopRequireDefault(require("invariant"));
var Blob = require('./Blob');
var BlobRegistry = require('./BlobRegistry');
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : r & 0x3 | 0x8;
    return v.toString(16);
  });
}
function createBlobCollector(blobId) {
  if (global.__blobCollectorProvider == null) {
    return null;
  } else {
    return global.__blobCollectorProvider(blobId);
  }
}
var BlobManager = function () {
  function BlobManager() {
    (0, _classCallCheck2.default)(this, BlobManager);
  }
  (0, _createClass2.default)(BlobManager, null, [{
    key: "createFromParts",
    value: function createFromParts(parts, options) {
      (0, _invariant.default)(_NativeBlobModule.default, 'NativeBlobModule is available.');
      var blobId = uuidv4();
      var items = parts.map(function (part) {
        if (part instanceof ArrayBuffer || global.ArrayBufferView && part instanceof global.ArrayBufferView) {
          throw new Error("Creating blobs from 'ArrayBuffer' and 'ArrayBufferView' are not supported");
        }
        if (part instanceof Blob) {
          return {
            data: part.data,
            type: 'blob'
          };
        } else {
          return {
            data: String(part),
            type: 'string'
          };
        }
      });
      var size = items.reduce(function (acc, curr) {
        if (curr.type === 'string') {
          return acc + global.unescape(encodeURI(curr.data)).length;
        } else {
          return acc + curr.data.size;
        }
      }, 0);
      _NativeBlobModule.default.createFromParts(items, blobId);
      return BlobManager.createFromOptions({
        blobId: blobId,
        offset: 0,
        size: size,
        type: options ? options.type : '',
        lastModified: options ? options.lastModified : Date.now()
      });
    }
  }, {
    key: "createFromOptions",
    value: function createFromOptions(options) {
      BlobRegistry.register(options.blobId);
      return Object.assign(Object.create(Blob.prototype), {
        data: options.__collector == null ? Object.assign({}, options, {
          __collector: createBlobCollector(options.blobId)
        }) : options
      });
    }
  }, {
    key: "release",
    value: function release(blobId) {
      (0, _invariant.default)(_NativeBlobModule.default, 'NativeBlobModule is available.');
      BlobRegistry.unregister(blobId);
      if (BlobRegistry.has(blobId)) {
        return;
      }
      _NativeBlobModule.default.release(blobId);
    }
  }, {
    key: "addNetworkingHandler",
    value: function addNetworkingHandler() {
      (0, _invariant.default)(_NativeBlobModule.default, 'NativeBlobModule is available.');
      _NativeBlobModule.default.addNetworkingHandler();
    }
  }, {
    key: "addWebSocketHandler",
    value: function addWebSocketHandler(socketId) {
      (0, _invariant.default)(_NativeBlobModule.default, 'NativeBlobModule is available.');
      _NativeBlobModule.default.addWebSocketHandler(socketId);
    }
  }, {
    key: "removeWebSocketHandler",
    value: function removeWebSocketHandler(socketId) {
      (0, _invariant.default)(_NativeBlobModule.default, 'NativeBlobModule is available.');
      _NativeBlobModule.default.removeWebSocketHandler(socketId);
    }
  }, {
    key: "sendOverSocket",
    value: function sendOverSocket(blob, socketId) {
      (0, _invariant.default)(_NativeBlobModule.default, 'NativeBlobModule is available.');
      _NativeBlobModule.default.sendOverSocket(blob.data, socketId);
    }
  }]);
  return BlobManager;
}();
BlobManager.isAvailable = !!_NativeBlobModule.default;
module.exports = BlobManager;
//# sourceMappingURL=BlobManager.js.map