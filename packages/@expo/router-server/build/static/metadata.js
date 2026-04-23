"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveMetadata = resolveMetadata;
const _ctx_1 = require("expo-router/_ctx");
const serialize_1 = require("../utils/metadata/serialize");
function createAbortError(signal) {
    const reason = signal.reason;
    if (reason instanceof Error) {
        return reason;
    }
    const error = new Error(typeof reason === 'string' ? reason : 'This operation was aborted.');
    error.name = 'AbortError';
    return error;
}
async function waitForMetadataResult(promise, signal) {
    if (!signal) {
        return promise;
    }
    if (signal.aborted) {
        throw createAbortError(signal);
    }
    return await new Promise((resolve, reject) => {
        const onAbort = () => reject(createAbortError(signal));
        signal.addEventListener('abort', onAbort, { once: true });
        promise.then((value) => {
            signal.removeEventListener('abort', onAbort);
            resolve(value);
        }, (error) => {
            signal.removeEventListener('abort', onAbort);
            reject(error);
        });
    });
}
function getGenerateMetadata(moduleExports) {
    return typeof moduleExports.generateMetadata === 'function'
        ? moduleExports.generateMetadata
        : null;
}
async function resolveMetadata(options) {
    if (options.request?.signal.aborted) {
        throw createAbortError(options.request.signal);
    }
    const routeModule = (await (0, _ctx_1.ctx)(options.route.file));
    if (!routeModule) {
        return null;
    }
    const generateMetadata = getGenerateMetadata(routeModule);
    if (!generateMetadata) {
        return null;
    }
    const metadata = await waitForMetadataResult(Promise.resolve(generateMetadata(options.request, options.params)), options.request?.signal);
    if (metadata == null) {
        return null;
    }
    return {
        metadata,
        headTags: (0, serialize_1.serializeMetadataToHtml)(metadata),
    };
}
//# sourceMappingURL=metadata.js.map