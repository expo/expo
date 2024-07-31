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
exports.renderRsc = void 0;
const server_1 = require("react-server-dom-webpack/server");
const server_2 = require("./server");
const server_actions_1 = require("../server-actions");
// Make global so we only pull in one instance for state saved in the react-server-dom-webpack package.
// @ts-ignore: HACK type for server actions
globalThis._REACT_registerServerReference = server_1.registerServerReference;
async function renderRsc(args, opts) {
    const { searchParams, method, input, body, contentType, context } = args;
    const { resolveClientEntry, entries } = opts;
    const { default: { renderEntries }, 
    // @ts-expect-error
    buildConfig, } = entries;
    const bundlerConfig = new Proxy({}, {
        get(_target, encodedId) {
            const [
            // File is the on-disk location of the module, this is injected during the "use client" transformation (babel).
            file, 
            // The name of the import (e.g. "default" or "")
            // This will be empty when using `module.exports = ` and `require('...')`.
            name = '',] = encodedId.split('#');
            // HACK: Special handling for server actions being recursively resolved, e.g. ai demo.
            if (encodedId.match(/[0-9a-z]{40}#/i)) {
                return { id: encodedId, chunks: [encodedId], name, async: true };
            }
            const filePath = file.startsWith('file://') ? fileURLToFilePath(file) : file;
            // We'll augment the file path with the incoming RSC request which will forward the metro props required to make a cache hit, e.g. platform=web&...
            // This is similar to how we handle lazy bundling.
            if (resolveClientEntry) {
                const resolved = resolveClientEntry(filePath);
                return { id: resolved.id, chunks: resolved.chunks, name, async: true };
            }
            return {
                // TODO: Make relative to server root for production exports.
                id: filePath,
                chunks: [
                    // TODO: Add a lookup later which reads from the SSR manifest to get the correct chunk.
                    'chunk:' + filePath,
                ],
                name,
                async: true,
            };
        },
    });
    const renderWithContext = async (context, input, searchParams) => {
        const renderStore = {
            context: context || {},
            rerender: () => {
                throw new Error('Cannot rerender');
            },
        };
        return (0, server_2.runWithRenderStore)(renderStore, async () => {
            const elements = await renderEntries(input, {
                searchParams,
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
            return (0, server_1.renderToReadableStream)(elements, bundlerConfig);
        });
    };
    const renderWithContextWithAction = async (context, actionFn, actionArgs) => {
        let elementsPromise = Promise.resolve({});
        let rendered = false;
        const renderStore = {
            context: context || {},
            rerender: async (input, searchParams = new URLSearchParams()) => {
                if (rendered) {
                    throw new Error('already rendered');
                }
                elementsPromise = Promise.all([
                    elementsPromise,
                    renderEntries(input, { searchParams, buildConfig }),
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
            return (0, server_1.renderToReadableStream)({ ...elements, _value: actionValue }, bundlerConfig);
        });
    };
    if (method === 'POST') {
        // TODO(Bacon): Fix Server action ID generation
        const rsfId = decodeURIComponent(input);
        let args = [];
        let bodyStr = '';
        if (body) {
            bodyStr = await streamToString(body);
        }
        if (typeof contentType === 'string' && contentType.startsWith('multipart/form-data')) {
            // XXX This doesn't support streaming unlike busboy
            const formData = parseFormData(bodyStr, contentType);
            args = await (0, server_1.decodeReply)(formData, bundlerConfig);
        }
        else if (bodyStr) {
            args = await (0, server_1.decodeReply)(bodyStr, bundlerConfig);
        }
        const [, name] = rsfId.split('#');
        // xxxx#greet
        if (!(0, server_actions_1.getServerReference)(rsfId)) {
            throw new Error(`Server action not found: "${rsfId}". ${(0, server_actions_1.getDebugDescription)()}`);
        }
        const mod = (0, server_actions_1.getServerReference)(rsfId);
        const fn = name ? mod[name] || mod : mod;
        return renderWithContextWithAction(context, fn, args);
    }
    // method === 'GET'
    return renderWithContext(context, input, searchParams);
}
exports.renderRsc = renderRsc;
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
const fileURLToFilePath = (fileURL) => {
    if (!fileURL.startsWith('file://')) {
        throw new Error('Not a file URL');
    }
    return decodeURI(fileURL.slice('file://'.length));
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