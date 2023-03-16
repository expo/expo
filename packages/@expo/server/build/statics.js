"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStaticMiddleware = void 0;
const send_1 = __importDefault(require("send"));
const url_1 = require("url");
const debug = console.log; //require('debug')('expo:server:static') as typeof console.log;
function getStaticMiddleware(root) {
    debug(`hosting:`, root);
    const opts = {
        root,
        extensions: ['html'],
    };
    return (req, res, next) => {
        if (!req?.url || (req.method !== 'GET' && req.method !== 'HEAD')) {
            return next();
        }
        // const platform = parsePlatformHeader(req);
        // Currently this is web-only
        // if (platform && platform !== 'web') {
        //   return next();
        // }
        const pathname = new url_1.URL(req.url, 'https://acme.dev').pathname;
        if (!pathname) {
            return next();
        }
        debug(`stream:`, pathname);
        const stream = (0, send_1.default)(req, pathname, opts);
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
exports.getStaticMiddleware = getStaticMiddleware;
