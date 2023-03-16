"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createRequestHandler = createRequestHandler;
function _fs() {
  const data = _interopRequireDefault(require("fs"));
  _fs = function () {
    return data;
  };
  return data;
}
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
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
function _environment() {
  const data = require("./environment");
  _environment = function () {
    return data;
  };
  return data;
}
function _static() {
  const data = require("./static");
  _static = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// Given build dir
// parse path
// import middleware function

(0, _environment().installGlobals)();
async function handleRouteHandlerAsync(func, req, res, next) {
  try {
    // 4. Execute.
    const response = await (func === null || func === void 0 ? void 0 : func(req, res, next));

    // 5. Respond
    if (response) {
      if (response.headers) {
        for (const [key, value] of Object.entries(response.headers)) {
          res.setHeader(key, value);
        }
      }
      if (response.status) {
        res.statusCode = response.status;
      }
      if (response.body) {
        res.end(response.body);
      } else {
        res.end();
      }
    } else {
      // TODO: Not sure what to do here yet
      res.statusCode = 404;
      res.end();
    }
  } catch (error) {
    // TODO: Symbolicate error stack
    console.error(error);
    res.statusCode = 500;
    res.end();
  }
}

// TODO: Reuse this for dev as well
function createRequestHandler(distFolder) {
  const statics = _path().default.join(distFolder, 'static');
  const routesManifest = JSON.parse(_fs().default.readFileSync(_path().default.join(distFolder, 'routes-manifest.json'), 'utf-8')).map(value => {
    return {
      ...value,
      regex: new RegExp(value.regex)
    };
  });
  const serveStatic = (0, _static().getStaticMiddleware)(statics);
  return async function handler(request, response,
  // TODO
  next = function (err) {
    console.error(err);
    response.statusCode = 404;
    return response.end('Not found');
  }) {
    if (!request.url || !request.method) {
      return next();
    }
    const url = new (_url().URL)(request.url, 'http://acme.dev');
    const sanitizedPathname = url.pathname.replace(/^\/+/, '').replace(/\/+$/, '') + '/';
    await new Promise((res, rej) => serveStatic(request, response, err => err ? rej(err) : res()));
    for (const route of routesManifest) {
      if (route.regex.test(sanitizedPathname)) {
        // console.log('Using:', route.src, sanitizedPathname, route.regex);
        if (route.src.startsWith('./static/')) {
          return serveStatic(request, response, next);
        }
        const func = require(_path().default.join(distFolder, route.src));
        if (func[request.method]) {
          return handleRouteHandlerAsync(func[request.method], request, response, next);
        } else {
          response.statusCode = 405;
          return response.end('Method not allowed');
        }
      }
    }

    // 404
    response.statusCode = 404;
    return response.end('Not found');
  };
}
//# sourceMappingURL=index.js.map