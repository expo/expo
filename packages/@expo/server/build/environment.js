"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ExpoResponse = void 0;
exports.installGlobals = installGlobals;
function _nodeFetch() {
  const data = _interopRequireWildcard(require("node-fetch"));
  _nodeFetch = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
// Ensure these are available for the API Routes.
function installGlobals() {
  // @ts-expect-error
  global.fetch = _nodeFetch().default;
  // @ts-expect-error
  global.Blob = _nodeFetch().Blob;
  // @ts-expect-error
  global.Body = _nodeFetch().Body;
  // @ts-expect-error
  global.Headers = _nodeFetch().Headers;

  // @ts-expect-error
  global.HeaderInit = _nodeFetch().HeaderInit;
  // @ts-expect-error
  global.HeadersInit = _nodeFetch().HeadersInit;
  // @ts-expect-error
  global.Request = _nodeFetch().Request;
  // @ts-expect-error
  global.Response = ExpoResponse;
  // @ts-expect-error
  global.BodyInit = _nodeFetch().BodyInit;
}
class ExpoResponse extends _nodeFetch().Response {
  // TODO: Drop when we upgrade to node-fetch v3
  static json(data = undefined, init = {}) {
    const body = JSON.stringify(data);
    if (body === undefined) {
      throw new TypeError('data is not JSON serializable');
    }

    // @ts-expect-error
    const headers = new (_nodeFetch().Headers)(init === null || init === void 0 ? void 0 : init.headers);
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
    return new ExpoResponse(body, {
      ...init,
      headers
    });
  }
}
exports.ExpoResponse = ExpoResponse;
//# sourceMappingURL=environment.js.map