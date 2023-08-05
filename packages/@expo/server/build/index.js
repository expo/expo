"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpoRequest = exports.ExpoResponse = exports.createRequestHandler = void 0;
require("@expo/server/install");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
const environment_1 = require("./environment");
Object.defineProperty(exports, "ExpoRequest", { enumerable: true, get: function () { return environment_1.ExpoRequest; } });
Object.defineProperty(exports, "ExpoResponse", { enumerable: true, get: function () { return environment_1.ExpoResponse; } });
const debug = require('debug')('expo:server');
function getProcessedManifest(path) {
    // TODO: JSON Schema for validation
    const routesManifest = JSON.parse(fs_1.default.readFileSync(path, 'utf-8'));
    const parsed = {
        ...routesManifest,
        functions: routesManifest.functions.map((value) => {
            return {
                ...value,
                regex: new RegExp(value.regex),
            };
        }),
        staticHtml: routesManifest.staticHtml.map((value) => {
            return {
                ...value,
                regex: new RegExp(value.regex),
            };
        }),
    };
    return parsed;
}
// TODO: Reuse this for dev as well
function createRequestHandler(distFolder) {
    const routesManifest = getProcessedManifest(path_1.default.join(distFolder, '_expo/routes.json'));
    const dynamicManifest = [...routesManifest.functions, ...routesManifest.staticHtml].filter((route) => route.type === 'dynamic' || route.dynamic);
    return async function handler(request) {
        const url = new url_1.URL(request.url, 'http://expo.dev');
        const sanitizedPathname = url.pathname.replace(/^\/+/, '').replace(/\/+$/, '') + '/';
        for (const route of dynamicManifest) {
            if (!route.regex.test(sanitizedPathname)) {
                continue;
            }
            const params = getSearchParams(route.src, sanitizedPathname);
            for (const [key, value] of Object.entries(params)) {
                if (value) {
                    request.expoUrl.searchParams.set(key, value);
                }
            }
            // Handle dynamic pages like `[foobar].tsx`
            if (route.type === 'static') {
                // serve a static file
                const filePath = path_1.default.join(distFolder, route.file.replace(/\.[tj]sx?$/, '.html'));
                return new environment_1.ExpoResponse(fs_1.default.readFileSync(filePath, 'utf-8'), {
                    status: 200,
                    headers: {
                        'Content-Type': 'text/html',
                    },
                });
            }
            const funcPath = path_1.default.join(distFolder, route.src);
            debug(`Handling dynamic route: ${route.file}: ${funcPath}`);
            const func = require(funcPath);
            const routeHandler = func[request.method];
            if (!routeHandler) {
                return new environment_1.ExpoResponse('Method not allowed', {
                    status: 405,
                    headers: {
                        'Content-Type': 'text/plain',
                    },
                });
            }
            try {
                // TODO: Handle undefined
                return (await routeHandler(request));
            }
            catch (error) {
                // TODO: Symbolicate error stack
                console.error(error);
                // const res = ExpoResponse.error();
                // res.status = 500;
                // return res;
                return new environment_1.ExpoResponse('Internal server error', {
                    status: 500,
                    headers: {
                        'Content-Type': 'text/plain',
                    },
                });
            }
        }
        // 404
        const response = new environment_1.ExpoResponse('Not found', {
            status: 404,
            headers: {
                'Content-Type': 'text/plain',
            },
        });
        return response;
    };
}
exports.createRequestHandler = createRequestHandler;
// Given a formatted URL like `/[foo]/bar/[baz].js` and a URL like `/hello/bar/world?other=1`
// return the processed search params like `{ baz: 'world', foo: 'hello', other: '1' }`
function getSearchParams(url, filePath) {
    const params = new URLSearchParams(url.split('?')[1]);
    const formattedParams = filePath.split('/').filter(Boolean);
    const searchParams = {};
    for (let i = 0; i < formattedParams.length; i++) {
        const param = formattedParams[i];
        if (param.startsWith('[')) {
            const key = param.replace(/[\[\]]/g, '');
            searchParams[key] = params.get(key);
        }
    }
    return searchParams;
}
