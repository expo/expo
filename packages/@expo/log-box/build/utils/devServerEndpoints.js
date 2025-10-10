"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBaseUrl = getBaseUrl;
exports.installPackageInProject = installPackageInProject;
exports.openFileInEditor = openFileInEditor;
exports.fetchProjectMetadataAsync = fetchProjectMetadataAsync;
exports.formatProjectFilePath = formatProjectFilePath;
exports.getFormattedStackTrace = getFormattedStackTrace;
exports.isStackFileAnonymous = isStackFileAnonymous;
exports.getStackFormattedLocation = getStackFormattedLocation;
exports.parseErrorStack = parseErrorStack;
exports.invalidateCachedStack = invalidateCachedStack;
exports.symbolicateStackAndCacheAsync = symbolicateStackAndCacheAsync;
const stacktrace_parser_1 = require("stacktrace-parser");
const cache = new Map();
function getBaseUrl() {
    const devServerOverride = process.env.EXPO_DEV_SERVER_ORIGIN;
    if (devServerOverride) {
        return devServerOverride;
    }
    if (process.env.EXPO_OS !== 'web') {
        const getDevServer = require('react-native/Libraries/Core/Devtools/getDevServer').default;
        const devServer = getDevServer();
        if (!devServer.bundleLoadedFromServer) {
            throw new Error('Cannot create devtools websocket connections in embedded environments.');
        }
        return devServer.url;
    }
    return window.location.protocol + '//' + window.location.host;
}
function installPackageInProject(pkg) {
    const url = new URL('/_expo/install-pkg', getBaseUrl()).href;
    // @ts-ignore
    if (globalThis.__polyfill_dom_fetchAsync) {
        // @ts-ignore
        globalThis.__polyfill_dom_fetchAsync(url, {
            method: 'POST',
            body: JSON.stringify({ pkg }),
        });
        return;
    }
    fetch(url, {
        method: 'POST',
        body: JSON.stringify({ pkg }),
    });
}
function openFileInEditor(file, lineNumber) {
    const url = new URL('/open-stack-frame', getBaseUrl()).href;
    // @ts-ignore
    if (globalThis.__polyfill_dom_fetchAsync) {
        // @ts-ignore
        globalThis.__polyfill_dom_fetchAsync(url, {
            method: 'POST',
            body: JSON.stringify({ file, lineNumber }),
        });
        return;
    }
    fetch(url, {
        method: 'POST',
        body: JSON.stringify({ file, lineNumber }),
    });
}
async function fetchProjectMetadataAsync() {
    const url = new URL('/_expo/error-overlay-meta', getBaseUrl()).href;
    // @ts-ignore
    if (globalThis.__polyfill_dom_fetchJsonAsync) {
        // @ts-ignore
        return await globalThis.__polyfill_dom_fetchJsonAsync(url, {
            method: 'GET',
        });
    }
    const response = await fetch(url, {
        method: 'GET',
    });
    return await response.json();
}
async function symbolicateStackTrace(stack) {
    const url = new URL('/symbolicate', getBaseUrl()).href;
    // @ts-ignore
    if (globalThis.__polyfill_dom_fetchJsonAsync) {
        // @ts-ignore
        return await globalThis.__polyfill_dom_fetchJsonAsync(url, {
            method: 'POST',
            body: JSON.stringify({ stack }),
        });
    }
    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ stack }),
    });
    return await response.json();
}
function formatProjectFilePath(projectRoot = '', file = null) {
    if (file == null) {
        return '<unknown>';
    }
    return pathRelativeToPath(file.replace(/\\/g, '/'), projectRoot.replace(/\\/g, '/')).replace(/\?.*$/, '');
}
function getFormattedStackTrace(projectRoot, stack) {
    return stack
        .map((frame) => {
        let stack = `  at `;
        const location = getStackFormattedLocation(projectRoot, frame);
        stack += `${frame.methodName ?? '<unknown>'} (${location})`;
        return stack;
    })
        .join('\n');
}
function pathRelativeToPath(path, relativeTo, sep = '/') {
    const relativeToParts = relativeTo.split(sep);
    const pathParts = path.split(sep);
    let i = 0;
    while (i < relativeToParts.length && i < pathParts.length) {
        if (relativeToParts[i] !== pathParts[i]) {
            break;
        }
        i++;
    }
    return pathParts.slice(i).join(sep);
}
function isStackFileAnonymous(frame) {
    return !frame.file || frame.file === '<unknown>' || frame.file === '<anonymous>';
}
function getStackFormattedLocation(projectRoot, frame) {
    const column = frame.column != null && parseInt(String(frame.column), 10);
    let location = formatProjectFilePath(projectRoot, frame.file);
    if (frame.lineNumber != null && frame.lineNumber >= 0) {
        location += ':' + frame.lineNumber;
        if (column && !isNaN(column) && column >= 0) {
            location += ':' + (column + 1);
        }
    }
    return location;
}
function parseErrorStack(stack) {
    if (stack == null) {
        return [];
    }
    if (Array.isArray(stack)) {
        return stack;
    }
    return (0, stacktrace_parser_1.parse)(stack).map((frame) => {
        // frame.file will mostly look like `http://localhost:8081/index.bundle?platform=web&dev=true&hot=false`
        return {
            ...frame,
            column: frame.column != null ? frame.column - 1 : null,
        };
    });
}
/**
 * Sanitize because sometimes, `symbolicateStackTrace` gives us invalid values.
 */
function normalizeMetroSymbolicatedStackResults({ stack: maybeStack, codeFrame, }) {
    if (!Array.isArray(maybeStack)) {
        throw new Error('Expected stack to be an array.');
    }
    const stack = maybeStack.map((maybeFrame) => {
        let collapse = false;
        if ('collapse' in maybeFrame) {
            if (typeof maybeFrame.collapse !== 'boolean') {
                throw new Error('Expected stack frame `collapse` to be a boolean.');
            }
            collapse = maybeFrame.collapse;
        }
        return {
            arguments: [],
            column: maybeFrame.column,
            file: maybeFrame.file,
            lineNumber: maybeFrame.lineNumber,
            methodName: maybeFrame.methodName,
            collapse,
        };
    });
    return { stack, codeFrame };
}
function invalidateCachedStack(stack) {
    cache.delete(stack);
}
function symbolicateStackAndCacheAsync(stack) {
    let promise = cache.get(stack);
    if (promise == null) {
        promise = symbolicateStackTrace(ensureStackFilesHaveParams(stack)).then(normalizeMetroSymbolicatedStackResults);
        cache.set(stack, promise);
    }
    return promise;
}
// Sometime the web stacks don't have correct query params, this can lead to Metro errors when it attempts to resolve without a platform.
// This will attempt to reconcile the issue by adding the current query params to the stack frames if they exist, or fallback to some common defaults.
function ensureStackFilesHaveParams(stack) {
    const currentSrc = typeof document !== 'undefined' && document.currentScript
        ? ('src' in document.currentScript && document.currentScript.src) || null
        : null;
    const currentParams = currentSrc
        ? new URLSearchParams(currentSrc)
        : new URLSearchParams({
            // @ts-ignore
            platform: globalThis.__polyfill_platform ?? process.env.EXPO_OS,
            dev: String(__DEV__),
        });
    return stack.map((frame) => {
        if (!frame.file?.startsWith('http') ||
            // Account for Metro malformed URLs
            frame.file.includes('&platform='))
            return frame;
        const url = new URL(frame.file);
        if (url.searchParams.has('platform')) {
            return frame;
        }
        currentParams.forEach((value, key) => {
            if (url.searchParams.has(key))
                return;
            url.searchParams.set(key, value);
        });
        return { ...frame, file: url.toString() };
    });
}
