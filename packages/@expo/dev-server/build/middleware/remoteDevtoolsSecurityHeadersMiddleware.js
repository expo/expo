"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.remoteDevtoolsSecurityHeadersMiddleware = remoteDevtoolsSecurityHeadersMiddleware;

// Like securityHeadersMiddleware but further allow cross-origin requests
// from https://chrome-devtools-frontend.appspot.com/
function remoteDevtoolsSecurityHeadersMiddleware(req, res, next) {
  // Block any cross origin request.
  if (typeof req.headers.origin === 'string' && !req.headers.origin.match(/^https?:\/\/localhost:/) && !req.headers.origin.match(/^https:\/\/chrome-devtools-frontend\.appspot\.com/)) {
    next(new Error(`Unauthorized request from ${req.headers.origin}. ` + 'This may happen because of a conflicting browser extension to intercept HTTP requests. ' + 'Please try again without browser extensions or using incognito mode.'));
    return;
  } // Block MIME-type sniffing.


  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
}
//# sourceMappingURL=remoteDevtoolsSecurityHeadersMiddleware.js.map