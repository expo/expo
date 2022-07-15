"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = __importDefault(require("net"));
const tls_1 = require("tls");
const url_1 = require("url");
const JsInspector_1 = require("../JsInspector");
function createJsInspectorMiddleware() {
    return async function (req, res, next) {
        var _a;
        const { origin, searchParams } = new url_1.URL((_a = req.url) !== null && _a !== void 0 ? _a : '/', getServerBase(req));
        const applicationId = searchParams.get('applicationId');
        if (!applicationId) {
            res.writeHead(400).end('Missing applicationId');
            return;
        }
        const app = await (0, JsInspector_1.queryInspectorAppAsync)(origin, applicationId);
        if (!app) {
            res.writeHead(404).end('Unable to find inspector target from metro-inspector-proxy');
            return;
        }
        if (req.method === 'GET') {
            const data = JSON.stringify(app);
            res.writeHead(200, {
                'Content-Type': 'application/json; charset=UTF-8',
                'Cache-Control': 'no-cache',
                'Content-Length': data.length.toString(),
            });
            res.end(data);
        }
        else if (req.method === 'POST' || req.method === 'PUT') {
            (0, JsInspector_1.openJsInspector)(app);
            res.end();
        }
        else {
            res.writeHead(405);
        }
    };
}
exports.default = createJsInspectorMiddleware;
function getServerBase(req) {
    const scheme = req.socket instanceof tls_1.TLSSocket && req.socket.encrypted === true ? 'https' : 'http';
    const { localAddress, localPort } = req.socket;
    const address = net_1.default.isIPv6(localAddress) ? `[${localAddress}]` : localAddress;
    return `${scheme}:${address}:${localPort}`;
}
//# sourceMappingURL=createJsInspectorMiddleware.js.map