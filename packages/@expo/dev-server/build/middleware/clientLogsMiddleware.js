"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDevicePlatformFromAppRegistryStartupMessage = void 0;
const chalk_1 = __importDefault(require("chalk"));
function clientLogsMiddleware(logger) {
    return function (req, res, next) {
        try {
            const deviceId = req.headers['device-id'];
            const deviceName = req.headers['device-name'];
            const expoPlatform = req.headers['expo-platform'];
            if (!deviceId) {
                res.writeHead(400).end('Missing Device-Id.');
                return;
            }
            if (!deviceName) {
                res.writeHead(400).end('Missing Device-Name.');
                return;
            }
            if (!req.body) {
                res.writeHead(400).end('Missing request body.');
                return;
            }
            handleDeviceLogs(logger, {
                deviceId: deviceId.toString(),
                deviceName: deviceName.toString(),
                logs: req.body,
                devicePlatform: expoPlatform === null || expoPlatform === void 0 ? void 0 : expoPlatform.toString(),
            });
        }
        catch (error) {
            logger.error({ tag: 'expo' }, `Error getting device logs: ${error} ${error.stack}`);
            next(error);
        }
        res.end('Success');
    };
}
exports.default = clientLogsMiddleware;
function isIgnorableBugReportingExtraData(body) {
    return body.length === 2 && body[0] === 'BugReporting extraData:';
}
function isAppRegistryStartupMessage(body) {
    return (body.length === 1 &&
        (/^Running application "main" with appParams:/.test(body[0]) ||
            /^Running "main" with \{/.test(body[0])));
}
function getDevicePlatformFromAppRegistryStartupMessage(body) {
    var _a, _b;
    if (body.length === 1 && typeof body[0] === 'string') {
        // Dangerously pick the platform out of the request URL
        // like: http:\\\\/\\\\/192.168.6.113:19000\\\\/index.bundle&platform=android\dev=true&hot=false&minify=false
        return (_b = (_a = body[0].match(/[?|&]platform=(\w+)[&|\\]/)) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : null;
    }
    return null;
}
exports.getDevicePlatformFromAppRegistryStartupMessage = getDevicePlatformFromAppRegistryStartupMessage;
function formatDevicePlatform(platform) {
    // Map the ID like "ios" to "iOS"
    const formatted = { ios: 'iOS', android: 'Android', web: 'Web' }[platform] || platform;
    return `${chalk_1.default.bold(formatted)} `;
}
function handleDeviceLogs(logger, { deviceId, deviceName, logs, devicePlatform, }) {
    for (const log of logs) {
        let body = Array.isArray(log.body) ? log.body : [log.body];
        let { level } = log;
        if (isIgnorableBugReportingExtraData(body)) {
            level = 'debug';
        }
        if (isAppRegistryStartupMessage(body)) {
            // If the installed version of expo is sending back the `device-platform` header
            // then use that, otherwise find it in the query string.
            const platformId = devicePlatform
                ? devicePlatform
                : getDevicePlatformFromAppRegistryStartupMessage(body);
            const platform = platformId ? formatDevicePlatform(platformId) : '';
            body = [`${platform}Running app on ${deviceName}`];
        }
        const args = body.map((obj) => {
            if (typeof obj === 'undefined') {
                return 'undefined';
            }
            if (obj === 'null') {
                return 'null';
            }
            if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
                return obj;
            }
            try {
                return JSON.stringify(obj);
            }
            catch {
                return obj.toString();
            }
        });
        const logLevel = level === 'info' || level === 'warn' || level === 'error' || level === 'debug'
            ? level
            : 'info';
        logger[logLevel]({
            tag: 'device',
            deviceId,
            deviceName,
            groupDepth: log.groupDepth,
            shouldHide: log.shouldHide,
            includesStack: log.includesStack,
        }, ...args);
    }
}
//# sourceMappingURL=clientLogsMiddleware.js.map