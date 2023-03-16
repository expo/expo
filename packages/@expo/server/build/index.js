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
require("source-map-support/register");
// Given build dir
// parse path
// import middleware function
(0, environment_1.installGlobals)();
// TODO: Reuse this for dev as well
function createRequestHandler(distFolder) {
    const statics = path_1.default.join(distFolder, 'static');
    const routesManifest = JSON.parse(fs_1.default.readFileSync(path_1.default.join(distFolder, 'routes-manifest.json'), 'utf-8')).map((value) => {
        return {
            ...value,
            regex: new RegExp(value.regex),
        };
    });
    const dynamicManifest = routesManifest.filter((route) => route.type === 'dynamic');
    const serveStatic = (0, statics_1.getStaticMiddleware)(statics);
    return async function handler(request) {
        const url = new url_1.URL(request.url, 'http://acme.dev');
        // Statics first
        const staticResponse = await serveStatic(url, request);
        if (staticResponse) {
            return staticResponse;
        }
        const sanitizedPathname = url.pathname.replace(/^\/+/, '').replace(/\/+$/, '') + '/';
        for (const route of dynamicManifest) {
            if (!route.regex.test(sanitizedPathname)) {
                continue;
            }
            const func = require(path_1.default.join(distFolder, route.src));
            const routeHandler = func[request.method];
            if (!routeHandler) {
                const response = environment_1.ExpoResponse.error();
                response.status = 405;
                response.statusText = 'Method not allowed';
                return response;
            }
            try {
                return (await routeHandler(request));
            }
            catch (error) {
                // TODO: Symbolicate error stack
                console.error(error);
                const res = environment_1.ExpoResponse.error();
                res.status = 500;
                return res;
            }
        }
        // 404
        const response = environment_1.ExpoResponse.error();
        response.status = 404;
        response.statusText = 'Not found';
        return response;
    };
}
exports.createRequestHandler = createRequestHandler;
