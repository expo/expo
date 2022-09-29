"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNpmProxy = exports.isYarnOfflineAsync = void 0;
const child_process_1 = require("child_process");
const dns_1 = __importDefault(require("dns"));
const url_1 = __importDefault(require("url"));
/** Determine if you should use yarn offline or not */
async function isYarnOfflineAsync() {
    if (await isUrlAvailableAsync('registry.yarnpkg.com')) {
        return false;
    }
    const proxy = getNpmProxy();
    if (!proxy) {
        return true;
    }
    const { hostname } = url_1.default.parse(proxy);
    if (!hostname) {
        return true;
    }
    return !(await isUrlAvailableAsync(hostname));
}
exports.isYarnOfflineAsync = isYarnOfflineAsync;
/** Exposed for testing */
function getNpmProxy() {
    if (process.env.https_proxy) {
        return process.env.https_proxy ?? null;
    }
    try {
        const httpsProxy = (0, child_process_1.execSync)('npm config get https-proxy').toString().trim();
        return httpsProxy !== 'null' ? httpsProxy : null;
    }
    catch {
        return null;
    }
}
exports.getNpmProxy = getNpmProxy;
function isUrlAvailableAsync(url) {
    return new Promise((resolve) => {
        dns_1.default.lookup(url, (err) => {
            resolve(!err);
        });
    });
}
//# sourceMappingURL=yarn.js.map