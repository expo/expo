"use strict";
// Related Metro error's formatting (for the portion of the function parsing Metro errors)
// https://github.com/facebook/metro/blob/34bb8913ec4b5b02690b39d2246599faf094f721/packages/metro/src/lib/formatBundlingError.js#L36
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMetroError = parseMetroError;
exports.parseBabelTransformError = parseBabelTransformError;
exports.parseBabelCodeFrameError = parseBabelCodeFrameError;
const BABEL_TRANSFORM_ERROR_FORMAT = /^(?:TransformError )?(?:SyntaxError: |ReferenceError: )(.*): (.*) \((\d+):(\d+)\)\n\n([\s\S]+)/;
const BABEL_CODE_FRAME_ERROR_FORMAT = 
// Adjusted from original to not capture import stack a part of the code frame
/^(?:TransformError )?(?:.*):? (?:.*?)([/|\\].*): ([\s\S]+?)\n((?:[ >]*\d+[\s|]+[^\n]*\n?)+|\u{001b}\[[0-9;]*m(?:.*\n?)+?(?=\n\n|\n[^\u{001b}\s]|$))/mu;
const METRO_ERROR_FORMAT = /^(?:(?:InternalError )?Metro has encountered an error:) (.*): (.*) \((\d+):(\d+)\)\n\n([\s\S]+)/u;
const UNABLE_TO_RESOLVE_MODULE_ERROR_FORMAT = /(?:\w )?Unable to resolve module (.*) from/;
function parseMetroError(message) {
    const e = message.match(METRO_ERROR_FORMAT);
    if (!e) {
        return null;
    }
    const [, content, fileName, row, column, codeFrame] = e;
    return {
        content,
        fileName,
        row: parseInt(row, 10),
        column: parseInt(column, 10),
        codeFrame,
    };
}
function parseBabelTransformError(message) {
    const e = message.match(BABEL_TRANSFORM_ERROR_FORMAT);
    if (!e) {
        return null;
    }
    // Transform errors are thrown from inside the Babel transformer.
    const [, fileName, content, row, column, codeFrame] = e;
    return {
        content,
        fileName,
        row: parseInt(row, 10),
        column: parseInt(column, 10),
        codeFrame,
    };
}
function parseBabelCodeFrameError(message) {
    const e = message.match(BABEL_CODE_FRAME_ERROR_FORMAT);
    if (!e) {
        return null;
    }
    // Codeframe errors are thrown from any use of buildCodeFrameError.
    const [, fileName, content, codeFrame] = e;
    //TODO: In the future we should send metadata from @expo/cli, but at the moment
    // parsing the message is the only way that work across all LogBox scenarios
    // (build web, build ios, build android, hmr web, hmr native).
    const [, missingModule] = message.match(UNABLE_TO_RESOLVE_MODULE_ERROR_FORMAT) || [];
    const messageContent = missingModule ? `Unable to resolve module ${missingModule}` : content;
    return {
        content: messageContent,
        fileName,
        row: -1,
        column: -1,
        codeFrame,
        missingModule,
    };
}
