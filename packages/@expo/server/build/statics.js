"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStaticMiddleware = void 0;
const send_1 = __importDefault(require("send"));
const environment_1 = require("./environment");
const debug = require('debug')('expo:server:static');
function getStaticMiddleware(root) {
    debug(`hosting:`, root);
    const opts = {
        root,
        extensions: ['html'],
    };
    return (url, req) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            return null;
        }
        // TODO: Use this as the rsc endpoint on native requests
        // const platform = parsePlatformHeader(req);
        // Currently this is web-only
        // if (platform && platform !== 'web') {
        //   return next();
        // }
        const pathname = url.pathname;
        if (!pathname) {
            return null;
        }
        debug(`stream:`, pathname);
        const stream = (0, send_1.default)(req, pathname, opts);
        // add file listener for fallthrough
        let forwardError = false;
        stream.on('file', function onFile() {
            // once file is determined, always forward error
            forwardError = true;
        });
        return new Promise((resolve, reject) => {
            // forward errors
            stream.on('error', function error(err) {
                if (forwardError || !(err.statusCode < 500)) {
                    reject(err);
                    return;
                }
                resolve(res);
            });
            const res = new environment_1.ExpoResponse();
            // pipe
            stream.pipe(res);
        });
    };
}
exports.getStaticMiddleware = getStaticMiddleware;
