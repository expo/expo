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
require("source-map-support/register");
(0, environment_1.installGlobals)();
// TODO: Reuse this for dev as well
function createRequestHandler(distFolder) {
    const routesManifest = JSON.parse(fs_1.default.readFileSync(path_1.default.join(distFolder, 'routes-manifest.json'), 'utf-8')).map((value) => {
        return {
            ...value,
            regex: new RegExp(value.regex),
        };
    });
    const dynamicManifest = routesManifest.filter((route) => route.type === 'dynamic' || route.dynamic);
    return async function handler(request) {
        const url = new url_1.URL(request.url, 'http://acme.dev');
        const sanitizedPathname = url.pathname.replace(/^\/+/, '').replace(/\/+$/, '') + '/';
        for (const route of dynamicManifest) {
            if (!route.regex.test(sanitizedPathname)) {
                continue;
            }
            // Handle dynamic pages like `[foobar].tsx`
            if (route.type === 'static') {
                // serve a static file
                const filePath = path_1.default.join(distFolder, route.file.replace(/\.[tj]sx?$/, '.html'));
                const response = new environment_1.ExpoResponse(fs_1.default.readFileSync(filePath, 'utf-8'), {
                    status: 200,
                    headers: {
                        'Content-Type': 'text/html',
                    },
                });
                return response;
            }
            const func = require(path_1.default.join(distFolder, route.src));
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
