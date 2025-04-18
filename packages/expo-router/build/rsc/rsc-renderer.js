"use strict";
/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 dai-shi.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * From waku https://github.com/dai-shi/waku/blob/32d52242c1450b5f5965860e671ff73c42da8bd0/packages/waku/src/lib/renderers/rsc-renderer.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderRsc = renderRsc;
// This file must remain platform agnostic for production exports.
// Import the runtime to support polyfills for webpack to load modules in the server using Metro.
require("@expo/metro-runtime/rsc/runtime");
const server_1 = require("react-server-dom-webpack/server");
const path_1 = require("./path");
const utils_1 = require("./router/utils");
const server_2 = require("./server");
async function renderRsc(args, opts) {
    const { input, body, contentType, context, onError } = args;
    const { resolveClientEntry, entries } = opts;
    const { default: { renderEntries }, 
    // @ts-expect-error
    buildConfig, } = entries;
    function resolveRequest(isServer, encodedId) {
        const [
        // File is the on-disk location of the module, this is injected during the "use client" transformation (babel).
        file, 
        // The name of the import (e.g. "default" or "")
        // This will be empty when using `module.exports = ` and `require('...')`.
        name = '',] = encodedId.split('#');
        const filePath = file.startsWith('file://') ? (0, path_1.fileURLToFilePath)(file) : file;
        args.moduleIdCallback?.({
            id: filePath,
            chunks: [
                // TODO: Add a lookup later which reads from the SSR manifest to get the correct chunk.
                // NOTE(EvanBacon): This is a placeholder since we need to render RSC to get the client boundaries, which we then inject later.
                'chunk:' + filePath,
            ],
            name,
            async: true,
        });
        // We'll augment the file path with the incoming RSC request which will forward the metro props required to make a cache hit, e.g. platform=web&...
        // This is similar to how we handle lazy bundling.
        const resolved = resolveClientEntry(filePath, isServer);
        return { id: resolved.id, chunks: resolved.chunks, name, async: true };
    }
    const bundlerConfig = new Proxy({}, {
        get(_target, encodedId) {
            return resolveRequest(false, encodedId);
        },
    });
    const serverConfig = new Proxy({}, {
        get(_target, encodedId) {
            return resolveRequest(true, encodedId);
        },
    });
    // @ts-ignore: Not part of global types. This is added to support server actions loading more actions.
    global[`${__METRO_GLOBAL_PREFIX__}__loadBundleAsync`] = opts.loadServerModuleRsc;
    const renderWithContext = async (context, input, params) => {
        const renderStore = {
            context: context || {},
            rerender: () => {
                throw new Error('Cannot rerender');
            },
        };
        return (0, server_2.runWithRenderStore)(renderStore, async () => {
            const elements = await renderEntries(input, {
                params,
                buildConfig,
            });
            if (elements === null) {
                const err = new Error('No function component found at: ' + input);
                err.statusCode = 404;
                throw err;
            }
            if (Object.keys(elements).some((key) => key.startsWith('_'))) {
                throw new Error('"_" prefix is reserved');
            }
            return (0, server_1.renderToReadableStream)(elements, bundlerConfig, {
                onError,
            });
        });
    };
    const renderWithContextWithAction = async (context, actionFn, actionArgs) => {
        let elementsPromise = Promise.resolve({});
        let rendered = false;
        const renderStore = {
            context: context || {},
            rerender: async (input, params) => {
                if (rendered) {
                    throw new Error('already rendered');
                }
                elementsPromise = Promise.all([
                    elementsPromise,
                    renderEntries(input, { params, buildConfig }),
                ]).then(([oldElements, newElements]) => ({
                    ...oldElements,
                    // FIXME we should actually check if newElements is null and send an error
                    ...newElements,
                }));
            },
        };
        return (0, server_2.runWithRenderStore)(renderStore, async () => {
            const actionValue = await actionFn(...actionArgs);
            const elements = await elementsPromise;
            rendered = true;
            if (Object.keys(elements).some((key) => key.startsWith('_'))) {
                throw new Error('"_" prefix is reserved');
            }
            return (0, server_1.renderToReadableStream)({ ...elements, _value: actionValue }, bundlerConfig, {
                onError,
            });
        });
    };
    let decodedBody = args.decodedBody;
    if (body) {
        const bodyStr = await streamToString(body);
        if (typeof contentType === 'string' && contentType.startsWith('multipart/form-data')) {
            // XXX This doesn't support streaming unlike busboy
            const formData = parseFormData(bodyStr, contentType);
            decodedBody = await (0, server_1.decodeReply)(formData, serverConfig);
        }
        else if (bodyStr) {
            decodedBody = await (0, server_1.decodeReply)(bodyStr, serverConfig);
        }
    }
    const actionId = (0, utils_1.decodeActionId)(input);
    if (actionId) {
        if (!opts.isExporting &&
            // @ts-ignore
            !process.env.EXPO_UNSTABLE_SERVER_FUNCTIONS) {
            throw new Error('Experimental support for React Server Functions is not enabled');
        }
        const args = Array.isArray(decodedBody) ? decodedBody : [];
        const chunkInfo = serverConfig[actionId];
        // Load module into memory.
        await Promise.all(chunkInfo.chunks.map((chunk) => globalThis.__webpack_chunk_load__(chunk)));
        // Import module.
        const mod = globalThis.__webpack_require__(chunkInfo.id);
        const fn = chunkInfo.name === '*' ? chunkInfo.name : mod[chunkInfo.name] || mod;
        if (!fn) {
            throw new Error(`Could not find server action: ${actionId}. Module: ${JSON.stringify(chunkInfo, null, 2)}`);
        }
        return renderWithContextWithAction(context, fn, args);
    }
    // method === 'GET'
    return renderWithContext(context, input, decodedBody);
}
// TODO is this correct? better to use a library?
const parseFormData = (body, contentType) => {
    const boundary = contentType.split('boundary=')[1];
    const parts = body.split(`--${boundary}`);
    const formData = new FormData();
    for (const part of parts) {
        if (part.trim() === '' || part === '--')
            continue;
        const [rawHeaders, content] = part.split('\r\n\r\n', 2);
        const headers = rawHeaders.split('\r\n').reduce((acc, currentHeader) => {
            const [key, value] = currentHeader.split(': ');
            acc[key.toLowerCase()] = value;
            return acc;
        }, {});
        const contentDisposition = headers['content-disposition'];
        const nameMatch = /name="([^"]+)"/.exec(contentDisposition);
        const filenameMatch = /filename="([^"]+)"/.exec(contentDisposition);
        if (nameMatch) {
            const name = nameMatch[1];
            if (filenameMatch) {
                const filename = filenameMatch[1];
                const type = headers['content-type'] || 'application/octet-stream';
                const blob = new Blob([content], { type });
                formData.append(name, blob, filename);
            }
            else {
                formData.append(name, content.trim());
            }
        }
    }
    return formData;
};
const streamToString = async (stream) => {
    const decoder = new TextDecoder();
    const reader = stream.getReader();
    const outs = [];
    let result;
    do {
        result = await reader.read();
        if (result.value) {
            if (!(result.value instanceof Uint8Array)) {
                throw new Error('Unexepected buffer type');
            }
            outs.push(decoder.decode(result.value, { stream: true }));
        }
    } while (!result.done);
    outs.push(decoder.decode());
    return outs.join('');
};
//# sourceMappingURL=rsc-renderer.js.map