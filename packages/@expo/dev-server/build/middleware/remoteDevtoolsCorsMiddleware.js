"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.remoteDevtoolsCorsMiddleware = remoteDevtoolsCorsMiddleware;
function _url() {
  const data = require("url");
  _url = function () {
    return data;
  };
  return data;
}
// Middleware that accepts multiple Access-Control-Allow-Origin for processing *.map.
// This is a hook middleware before metro processing *.map,
// which originally allow only devtools://devtools
function remoteDevtoolsCorsMiddleware(req, res, next) {
  if (req.url) {
    var _url$pathname;
    const url = (0, _url().parse)(req.url);
    const origin = req.headers.origin;
    const isValidOrigin = origin && ['devtools://devtools', 'https://chrome-devtools-frontend.appspot.com'].includes(origin);
    if ((_url$pathname = url.pathname) !== null && _url$pathname !== void 0 && _url$pathname.endsWith('.map') && origin && isValidOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);

      // Prevent metro overwrite Access-Control-Allow-Origin header
      const setHeader = res.setHeader.bind(res);
      res.setHeader = (key, ...args) => {
        if (key !== 'Access-Control-Allow-Origin') {
          setHeader(key, ...args);
        }
        return res;
      };
    }
  }
  next();
}
//# sourceMappingURL=remoteDevtoolsCorsMiddleware.js.map