"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerInsertedHTMLContext = void 0;
exports.useServerInsertedHTML = useServerInsertedHTML;
const react_1 = require("react");
exports.ServerInsertedHTMLContext = (0, react_1.createContext)(null);
/**
 * Registers a callback that is rendered to static HTML and injected into the
 * server-rendered HTML stream on every React flush. The first injection is placed
 * before `</head>`, subsequent injections are emitted right before the React chunk
 * for the flush that triggered them (for example when a Suspense boundary resolves).
 *
 * Use this to transport data alongside the streamed HTML, such as serialized query
 * results for client-side cache hydration, or styles collected by CSS-in-JS libraries.
 * The callback is invoked outside the React tree of the app, so it cannot rely on
 * app context, and it must render synchronously (it cannot suspend).
 *
 * The callback is invoked once per flush and a new callback instance is registered
 * whenever the calling component re-renders (matching Next.js semantics), so callbacks
 * must be drain-style: emit only the content that has not been flushed yet and return
 * `null` when there is nothing new.
 *
 * Only takes effect during streaming server rendering (`web.output: 'server'` with
 * the `unstable_useServerRendering` option of the `expo-router` config plugin).
 * On the client and on native platforms this hook is a no-op.
 *
 * @example
 * ```tsx
 * import { useServerInsertedHTML } from 'expo-router';
 *
 * function StreamedDataTransport() {
 *   const queue = useDataQueue();
 *   useServerInsertedHTML(() => {
 *     const payload = queue.flush();
 *     if (!payload) return null;
 *     return <script dangerouslySetInnerHTML={{ __html: payload }} />;
 *   });
 *   return null;
 * }
 * ```
 */
function useServerInsertedHTML(callback) {
    const addInsertedHTML = (0, react_1.use)(exports.ServerInsertedHTMLContext);
    // The context is only provided during streaming server rendering.
    addInsertedHTML?.(callback);
}
//# sourceMappingURL=ServerInsertedHTML.js.map