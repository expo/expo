Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var TurboModuleRegistry = _interopRequireWildcard(require("../TurboModule/TurboModuleRegistry"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var NativeModule = TurboModuleRegistry.get('BlobModule');
var constants = null;
var NativeBlobModule = null;
if (NativeModule != null) {
  NativeBlobModule = {
    getConstants: function getConstants() {
      if (constants == null) {
        constants = NativeModule.getConstants();
      }
      return constants;
    },
    addNetworkingHandler: function addNetworkingHandler() {
      NativeModule.addNetworkingHandler();
    },
    addWebSocketHandler: function addWebSocketHandler(id) {
      NativeModule.addWebSocketHandler(id);
    },
    removeWebSocketHandler: function removeWebSocketHandler(id) {
      NativeModule.removeWebSocketHandler(id);
    },
    sendOverSocket: function sendOverSocket(blob, socketID) {
      NativeModule.sendOverSocket(blob, socketID);
    },
    createFromParts: function createFromParts(parts, withId) {
      NativeModule.createFromParts(parts, withId);
    },
    release: function release(blobId) {
      NativeModule.release(blobId);
    }
  };
}
var _default = NativeBlobModule;
exports.default = _default;