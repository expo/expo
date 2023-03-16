"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getStaticMiddleware = getStaticMiddleware;
function _send() {
  const data = _interopRequireDefault(require("send"));
  _send = function () {
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
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const debug = require('debug')('expo:server:static');
function getStaticMiddleware(root) {
  debug(`hosting:`, root);
  const opts = {
    root,
    extensions: ['html']
  };
  return (req, res, next) => {
    if (!(req !== null && req !== void 0 && req.url) || req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }

    // const platform = parsePlatformHeader(req);
    // Currently this is web-only
    // if (platform && platform !== 'web') {
    //   return next();
    // }

    const pathname = new (_url().URL)(req.url, 'https://acme.dev').pathname;
    if (!pathname) {
      return next();
    }
    debug(`stream:`, pathname);
    const stream = (0, _send().default)(req, pathname, opts);

    // add file listener for fallthrough
    let forwardError = false;
    stream.on('file', function onFile() {
      // once file is determined, always forward error
      forwardError = true;
    });

    // forward errors
    stream.on('error', function error(err) {
      if (forwardError || !(err.statusCode < 500)) {
        next(err);
        return;
      }
      next();
    });

    // pipe
    stream.pipe(res);
  };
}
//# sourceMappingURL=static.js.map