"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSymbolicateMiddleware = void 0;
const metro_config_1 = require("@expo/metro-config");
const path_1 = __importDefault(require("path"));
const Symbolicator_1 = require("./Symbolicator");
const getFileAsync_1 = require("./getFileAsync");
// Customize the stack frames like we do in Metro projects.
function customizeFrame(frame) {
    var _a;
    let collapse = Boolean(frame.file && metro_config_1.INTERNAL_CALLSITES_REGEX.test(frame.file));
    if (!collapse) {
        // This represents the first frame of the stacktrace.
        // Often this looks like: `__r(0);`.
        // The URL will also be unactionable in the app and therefore not very useful to the developer.
        if (frame.column === 3 &&
            frame.methodName === 'global code' &&
            ((_a = frame.file) === null || _a === void 0 ? void 0 : _a.match(/^https?:\/\//g))) {
            collapse = true;
        }
    }
    return { ...(frame || {}), collapse };
}
function createSymbolicateMiddleware({ projectRoot, logger, compiler, }) {
    const getFilenameFromUrl = (0, getFileAsync_1.createGetFileNameFromUrl)(compiler);
    const symbolicate = new Symbolicator_1.Symbolicator({
        projectRoot,
        logger,
        customizeFrame,
        async getFileAsync(props) {
            const fileName = getFilenameFromUrl(props);
            return (0, getFileAsync_1.getFileFromCompilerAsync)(compiler, { fileName, platform: props.platform });
        },
        async getSourceMapAsync(props) {
            var _a, _b;
            const fileName = getFilenameFromUrl(props);
            const fallbackSourceMapFilename = `${fileName}.map`;
            const bundle = await (0, getFileAsync_1.getFileFromCompilerAsync)(compiler, {
                fileName,
                platform: props.platform,
            });
            const sourceMappingUrl = (_a = /sourceMappingURL=(.+)$/.exec(bundle)) === null || _a === void 0 ? void 0 : _a[1];
            const sourceMapBasename = (_b = sourceMappingUrl === null || sourceMappingUrl === void 0 ? void 0 : sourceMappingUrl.split('?')) === null || _b === void 0 ? void 0 : _b[0];
            let sourceMapFilename = fallbackSourceMapFilename;
            if (sourceMapBasename) {
                sourceMapFilename = path_1.default.join(path_1.default.dirname(fileName), sourceMapBasename);
            }
            let parseError = null;
            for (const file of [sourceMapFilename, fallbackSourceMapFilename]) {
                try {
                    return await (0, getFileAsync_1.getFileFromCompilerAsync)(compiler, {
                        fileName: file,
                        platform: props.platform,
                    });
                }
                catch (error) {
                    parseError = error;
                    console.warn('Failed to read source map from sourceMappingURL:', file);
                    // logger.warn({ tag: 'dev-server' }, 'Failed to read source map from sourceMappingURL');
                }
            }
            throw parseError;
        },
    });
    return async function (req, res) {
        var _a, _b;
        try {
            if (!req.rawBody) {
                return res.writeHead(400).end('Missing request rawBody.');
            }
            const { stack } = JSON.parse(req.rawBody);
            const platform = (_b = (_a = (0, getFileAsync_1.getPlatformFromRequest)(req)) !== null && _a !== void 0 ? _a : Symbolicator_1.Symbolicator.inferPlatformFromStack(stack)) !== null && _b !== void 0 ? _b : 'web';
            if (!platform) {
                return res
                    .writeHead(400)
                    .end('Missing expo-platform header, platform query parameter, or platform parameter in source map comment url');
            }
            const parsed = await symbolicate.process(stack, { platform });
            return res.end(JSON.stringify(parsed));
        }
        catch (error) {
            console.error(`Failed to symbolicate: ${error} ${error.stack}`);
            // logger.error({ tag: 'dev-server' }, `Failed to symbolicate: ${error} ${error.stack}`);
            res.statusCode = 500;
            return res.end(JSON.stringify({ error: error.message }));
        }
    };
}
exports.createSymbolicateMiddleware = createSymbolicateMiddleware;
//# sourceMappingURL=symbolicateMiddleware.js.map