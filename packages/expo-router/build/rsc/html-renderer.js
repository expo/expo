"use strict";
// SSR middleware:
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderHtml = void 0;
// Support loading other modules in the Node runtime.
require("@expo/metro-runtime");
const react_1 = require("react");
const server_edge_1 = require("react-dom/server.edge");
const client_edge_1 = require("react-server-dom-webpack/client.edge");
const host_1 = require("./router/host");
async function renderHtml({ pathname, isExporting, htmlHead, searchParams, serverRoot, loadModule, getSsrConfigForHtml, resolveClientEntry, renderRscForHtml, scriptUrl, }) {
    // @ts-ignore: Not part of global types. This is added to support loading more modules.
    global[`${__METRO_GLOBAL_PREFIX__}__loadBundleAsync`] = loadModule;
    const ssrConfig = await getSsrConfigForHtml?.(pathname, searchParams);
    if (!ssrConfig) {
        return null;
    }
    console.log('render stream:', ssrConfig);
    let stream;
    try {
        stream = await renderRscForHtml(ssrConfig.input || '/', ssrConfig.searchParams || searchParams);
    }
    catch (e) {
        if ('statusCode' in e && e.statusCode === 404) {
            return null;
        }
        throw e;
    }
    const moduleMap = new Proxy({}, {
        get(_target, filePath) {
            return new Proxy({}, {
                get(_target, name) {
                    const fp = joinPath(serverRoot, filePath);
                    const { id, chunks } = resolveClientEntry(fp);
                    console.log('SSR module map:', { fp, filePath, name, id, chunks });
                    // console.log('SSR module map>>id:', id, chunks);
                    return { id, chunks, name, async: true };
                    // const resolveClientEntry
                    // // TODO: All of this...
                    // // const id = filePath.slice(serverRoot.length);
                    // // (globalThis as any).__EXPO_CLIENT_CHUNK_LOAD__(id, (id: string) =>
                    // //   loadModule(joinPath(DIST_SSR, id))
                    // // );
                    // return { id: filePath, chunks: [id], name };
                },
            });
        },
    });
    console.log('moduleMap:', moduleMap);
    console.log('stream:', stream);
    // Safe verbetim from waku
    const config = {
        basePath: '',
        htmlAttrs: '',
        rscPath: '/_flight',
        srcDir: 'TODO+SRC',
    };
    const [stream1, stream2] = stream.tee();
    const elements = (0, client_edge_1.createFromReadableStream)(stream1, {
        ssrManifest: { moduleMap, moduleLoading: null },
    });
    console.log('elements:', elements);
    const body = (0, client_edge_1.createFromReadableStream)(ssrConfig.body, {
        ssrManifest: { moduleMap, moduleLoading: null },
    });
    const readable = (await (0, server_edge_1.renderToReadableStream)(buildHtml(react_1.createElement, config.htmlAttrs, htmlHead, (0, react_1.createElement)(host_1.ServerRoot, { elements }, body)), {
        onError(err) {
            console.error(err);
        },
    }))
        .pipeThrough(rectifyHtml())
        .pipeThrough(injectScript(config.basePath + config.rscPath + '/web/' + encodeInput(ssrConfig.input), !isExporting && scriptUrl != null ? scriptUrl : ''))
        .pipeThrough(injectRSCPayload(stream2));
    return readable;
}
exports.renderHtml = renderHtml;
const parseHtmlAttrs = (attrs) => {
    // HACK this is very brittle
    const result = {};
    const kebab2camel = (s) => s.replace(/-./g, (m) => m[1].toUpperCase());
    const matches = attrs.matchAll(/(?<=^|\s)([^\s=]+)="([^"]+)"(?=\s|$)/g);
    for (const match of matches) {
        result[kebab2camel(match[1])] = match[2];
    }
    return result;
};
const buildHtml = (createElement, attrs, head, body) => createElement('html', attrs ? parseHtmlAttrs(attrs) : null, createElement('head', { dangerouslySetInnerHTML: { __html: head } }), createElement('body', { 'data-hydrate': true }, body));
const fakeFetchCode = `
Promise.resolve(new Response(new ReadableStream({
  start(c) {
    const d = (self.__FLIGHT_DATA ||= []);
    const t = new TextEncoder();
    const f = (s) => c.enqueue(typeof s === 'string' ? t.encode(s) : s);
    d.forEach(f);
    d.push = f;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => c.close());
    } else {
      c.close();
    }
  }
})))
`
    .split('\n')
    .map((line) => line.trim())
    .join('');
/**
 * Injects a script into the HTML stream.
 * @param urlForFakeFetch - The URL for the fake fetch.
 * @param mainJsPath - The path to the main JavaScript file (for DEV only, pass `''` for PRD).
 * @returns A TransformStream that injects the script into the HTML stream.
 */
const injectScript = (urlForFakeFetch, mainJsPath // for DEV only, pass `''` for PRD
) => {
    /**
     * Modifies the head of the HTML to include the prefetch script.
     * @param data - The HTML data.
     * @returns The modified HTML data.
     */
    const modifyHead = (data) => {
        const matchPrefetched = data.match(
        // HACK This is very brittle
        /(.*<script[^>]*>\nglobalThis\.__EXPO_PREFETCHED__ = {\n)(.*?)(\n};.*)/s);
        if (matchPrefetched) {
            data = matchPrefetched[1] + `  '${urlForFakeFetch}': ${fakeFetchCode},` + matchPrefetched[3];
        }
        const closingHeadIndex = data.indexOf('</head>');
        if (closingHeadIndex === -1) {
            throw new Error('closing head not found');
        }
        let code = '';
        if (!matchPrefetched) {
            code += `
  globalThis.__EXPO_PREFETCHED__ = {
    '${urlForFakeFetch}': ${fakeFetchCode},
  };
  `;
        }
        if (code) {
            data =
                data.slice(0, closingHeadIndex) +
                    `<script type="module" async>${code}</script>` +
                    data.slice(closingHeadIndex);
        }
        return data;
    };
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let headSent = false;
    let data = '';
    return new TransformStream({
        transform(chunk, controller) {
            if (!(chunk instanceof Uint8Array)) {
                throw new Error('Unknown chunk type');
            }
            data += decoder.decode(chunk);
            if (!headSent) {
                if (!/<\/head><body[^>]*>/.test(data)) {
                    return;
                }
                headSent = true;
                data = modifyHead(data);
                if (mainJsPath) {
                    const closingBodyIndex = data.indexOf('</body>');
                    const [firstPart, secondPart] = closingBodyIndex === -1
                        ? [data, '']
                        : [data.slice(0, closingBodyIndex), data.slice(closingBodyIndex)];
                    data = firstPart + `<script src="${mainJsPath}" async></script>` + secondPart;
                }
            }
            controller.enqueue(encoder.encode(data));
            data = '';
        },
    });
};
// HACK for now, do we want to use HTML parser?
/**
 * A TransformStream that buffers HTML chunks and processes them when a closing tag is detected.
 * This is useful for ensuring that HTML is properly rectified before further processing.
 * @returns {TransformStream<Uint8Array, Uint8Array>} A TransformStream that buffers and processes HTML chunks.
 */
const rectifyHtml = () => {
    const pending = [];
    const decoder = new TextDecoder();
    let timer;
    return new TransformStream({
        transform(chunk, controller) {
            if (!(chunk instanceof Uint8Array)) {
                throw new Error('Unknown chunk type');
            }
            pending.push(chunk);
            // Check if the chunk ends with a closing tag
            if (/<\/\w+>$/.test(decoder.decode(chunk))) {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    controller.enqueue(concatUint8Arrays(pending.splice(0)));
                });
            }
        },
        flush(controller) {
            clearTimeout(timer);
            if (pending.length) {
                controller.enqueue(concatUint8Arrays(pending.splice(0)));
            }
        },
    });
};
// for filePath
const joinPath = (...paths) => {
    const isAbsolute = paths[0]?.startsWith('/');
    const items = [].concat(...paths.map((path) => path.split('/')));
    let i = 0;
    while (i < items.length) {
        if (items[i] === '.' || items[i] === '') {
            items.splice(i, 1);
        }
        else if (items[i] === '..') {
            if (i > 0) {
                items.splice(i - 1, 2);
                --i;
            }
            else {
                items.splice(i, 1);
            }
        }
        else {
            ++i;
        }
    }
    return (isAbsolute ? '/' : '') + items.join('/') || '.';
};
const concatUint8Arrays = (arrs) => {
    const len = arrs.reduce((acc, arr) => acc + arr.length, 0);
    const array = new Uint8Array(len);
    let offset = 0;
    for (const arr of arrs) {
        array.set(arr, offset);
        offset += arr.length;
    }
    return array;
};
const encodeInput = (input) => {
    if (input === '') {
        return 'index.txt';
    }
    if (input === 'index') {
        throw new Error('Input should not be `index`');
    }
    if (input.startsWith('/')) {
        throw new Error('Input should not start with `/`');
    }
    if (input.endsWith('/')) {
        throw new Error('Input should not end with `/`');
    }
    return input + '.txt';
};
const encoder = new TextEncoder();
const trailer = '</body></html>';
/**
 * Injects RSC payload into the HTML stream.
 * @param rscStream - The ReadableStream containing the RSC payload.
 * @returns A TransformStream that injects the RSC payload into the HTML stream.
 */
function injectRSCPayload(rscStream) {
    const decoder = new TextDecoder();
    let resolveFlightDataPromise;
    const flightDataPromise = new Promise((resolve) => (resolveFlightDataPromise = resolve));
    let started = false;
    return new TransformStream({
        async transform(chunk, controller) {
            let buf = decoder.decode(chunk);
            if (buf.endsWith(trailer)) {
                buf = buf.slice(0, -trailer.length);
            }
            controller.enqueue(encoder.encode(buf));
            if (!started) {
                started = true;
                setTimeout(async () => {
                    try {
                        await writeRSCStream(rscStream, controller);
                    }
                    catch (err) {
                        controller.error(err);
                    }
                    resolveFlightDataPromise();
                }, 0);
            }
        },
        async flush(controller) {
            await flightDataPromise;
            controller.enqueue(encoder.encode('</body></html>'));
        },
    });
}
/**
 * Asynchronously processes a ReadableStream of chunks, attempting to decode each chunk as a UTF-8 string.
 * If decoding fails (e.g., due to binary data), the chunk is encoded as a base64 string and written as a Uint8Array.
 *
 * @param {ReadableStream<Uint8Array>} rscStream - The ReadableStream of Uint8Array chunks to process.
 * @param {TransformStreamDefaultController<Uint8Array>} controller - The controller to which the processed chunks are written.
 *
 * @throws {Error} If an error occurs during decoding or encoding of the chunks.
 */
async function writeRSCStream(rscStream, controller) {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    for await (const chunk of rscStream) {
        // Try decoding the chunk to send as a string.
        // If that fails (e.g. binary data that is invalid unicode), write as base64.
        try {
            writeChunk(JSON.stringify(decoder.decode(chunk, { stream: true })), controller);
        }
        catch {
            const base64 = JSON.stringify(btoa(String.fromCodePoint(...chunk)));
            writeChunk(`Uint8Array.from(atob(${base64}), m => m.codePointAt(0))`, controller);
        }
    }
    const remaining = decoder.decode();
    if (remaining.length) {
        writeChunk(JSON.stringify(remaining), controller);
    }
}
/**
 * Writes a chunk of data to the controller, escaping it for safe inclusion in a script tag.
 * @param {string} chunk - The chunk of data to write.
 * @param {WritableStreamDefaultWriter<string>} controller - The controller to which the chunk is written.
 */
function writeChunk(chunk, controller) {
    controller.enqueue(encoder.encode(`<script>${escapeScript(`(self.__FLIGHT_DATA||=[]).push(${chunk})`)}</script>`));
}
/**
 * Escapes closing script tags and HTML comments in JavaScript content to prevent breaking out of the script context.
 * @param {string} script - The script content to escape.
 * @returns {string} - The escaped script content.
 */
function escapeScript(script) {
    return script.replace(/<!--/g, '<\\!--').replace(/<\/(script)/gi, '</\\$1');
}
//# sourceMappingURL=html-renderer.js.map