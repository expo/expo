"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createJsInspectorMiddleware;
function _chalk() {
  const data = _interopRequireDefault(require("chalk"));
  _chalk = function () {
    return data;
  };
  return data;
}
function _net() {
  const data = _interopRequireDefault(require("net"));
  _net = function () {
    return data;
  };
  return data;
}
function _tls() {
  const data = require("tls");
  _tls = function () {
    return data;
  };
  return data;
}
function _url() {
  const data = require("url");
  _url = function () {
    return data;
  };
  return data;
}
function _JsInspector() {
  const data = require("../JsInspector");
  _JsInspector = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function createJsInspectorMiddleware() {
  return async function (req, res, next) {
    var _req$url;
    const {
      origin,
      searchParams
    } = new (_url().URL)((_req$url = req.url) !== null && _req$url !== void 0 ? _req$url : '/', getServerBase(req));
    const applicationId = searchParams.get('applicationId');
    if (!applicationId) {
      res.writeHead(400).end('Missing applicationId');
      return;
    }
    const app = await (0, _JsInspector().queryInspectorAppAsync)(origin, applicationId);
    if (!app) {
      res.writeHead(404).end('Unable to find inspector target from metro-inspector-proxy');
      console.warn(_chalk().default.yellow('No compatible apps connected. JavaScript Debugging can only be used with the Hermes engine.'));
      return;
    }
    if (req.method === 'GET') {
      const data = JSON.stringify(app);
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-cache',
        'Content-Length': data.length.toString()
      });
      res.end(data);
    } else if (req.method === 'POST' || req.method === 'PUT') {
      try {
        await (0, _JsInspector().openJsInspector)(app);
      } catch (error) {
        var _error$message;
        // abort(Error: Command failed: osascript -e POSIX path of (path to application "google chrome")
        // 15:50: execution error: Google Chrome got an error: Application isn’t running. (-600)

        console.error(_chalk().default.red('Error launching JS inspector: ' + ((_error$message = error === null || error === void 0 ? void 0 : error.message) !== null && _error$message !== void 0 ? _error$message : 'Unknown error occurred')));
        res.writeHead(500);
        res.end();
        return;
      }
      res.end();
    } else {
      res.writeHead(405);
    }
  };
}
function getServerBase(req) {
  const scheme = req.socket instanceof _tls().TLSSocket && req.socket.encrypted === true ? 'https' : 'http';
  const {
    localAddress,
    localPort
  } = req.socket;
  const address = localAddress && _net().default.isIPv6(localAddress) ? `[${localAddress}]` : localAddress;
  return `${scheme}:${address}:${localPort}`;
}
//# sourceMappingURL=createJsInspectorMiddleware.js.map