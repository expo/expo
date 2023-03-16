"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestHandler = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
const environment_1 = require("./environment");
const statics_1 = require("./statics");
// Given build dir
// parse path
// import middleware function
(0, environment_1.installGlobals)();
async function handleRouteHandlerAsync(func, req, res, next) {
    try {
        // 4. Execute.
        return (await func?.(req, res, next));
        // // 5. Respond
        // if (response) {
        //   if (response.headers) {
        //     for (const [key, value] of Object.entries(response.headers)) {
        //       res.setHeader(key, value);
        //     }
        //   }
        //   if (response.status) {
        //     res.statusCode = response.status;
        //   }
        //   return response;
        // //   if (response.body) {
        // //     res.end(response.body);
        // //   } else {
        // //     res.end();
        // //   }
        // } else {
        //   // TODO: Not sure what to do here yet
        //   res.statusCode = 404;
        //   res.end();
        // }
    }
    catch (error) {
        // TODO: Symbolicate error stack
        console.error(error);
        // res.st = 500;
        // res.end();
        return environment_1.ExpoResponse.error();
    }
}
// TODO: Reuse this for dev as well
function createRequestHandler(distFolder) {
    const statics = path_1.default.join(distFolder, 'static');
    const routesManifest = JSON.parse(fs_1.default.readFileSync(path_1.default.join(distFolder, 'routes-manifest.json'), 'utf-8')).map((value) => {
        return {
            ...value,
            regex: new RegExp(value.regex),
        };
    });
    const serveStatic = (0, statics_1.getStaticMiddleware)(statics);
    return async function handler(request, response, 
    // TODO
    next = function (err) {
        console.error(err);
        response.status = 404;
        response.statusText = 'Not found';
        return response;
        //   return response.end('Not found');
    }) {
        if (!request.url || !request.method) {
            return next();
        }
        const url = new url_1.URL(request.url, 'http://acme.dev');
        const sanitizedPathname = url.pathname.replace(/^\/+/, '').replace(/\/+$/, '') + '/';
        await new Promise((res, rej) => serveStatic(request, response, (err) => (err ? rej(err) : res())));
        for (const route of routesManifest) {
            if (route.regex.test(sanitizedPathname)) {
                // console.log('Using:', route.src, sanitizedPathname, route.regex);
                if (route.src.startsWith('./static/')) {
                    return serveStatic(request, response, next);
                }
                const func = require(path_1.default.join(distFolder, route.src));
                if (func[request.method]) {
                    return handleRouteHandlerAsync(func[request.method], request, response, next);
                }
                else {
                    response.status = 405;
                    response.statusText = 'Method not allowed';
                    return response;
                }
            }
        }
        // 404
        response.status = 404;
        response.statusText = 'Not found';
        return response;
    };
}
exports.createRequestHandler = createRequestHandler;
