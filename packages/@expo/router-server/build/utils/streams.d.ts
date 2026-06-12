type HeadInjectionOptions = {
    injectionParts: string[];
    htmlAttributes?: string;
    bodyAttributes?: string;
};
/**
 * Buffers the initial HTML document prefix, injects head content plus any serialized document
 * attributes, then switches to passthrough mode for the rest of the stream.
 */
export declare function createDocumentMetadataInjectionTransform(options: HeadInjectionOptions): TransformStream<Uint8Array, Uint8Array>;
/**
 * Injects dynamically-rendered HTML into the stream at React flush boundaries, for
 * `useServerInsertedHTML()` support. `getInsertedHTML()` drains the HTML produced by the
 * currently registered callbacks and is invoked once per emitted flush:
 *
 * - The first injection is spliced in before `</head>` (buffering until the document head
 *   is complete, which React emits with the shell).
 * - Each subsequent injection is emitted immediately before the React chunk for that flush,
 *   so transported data is available before React's inline scripts reveal the Suspense
 *   content of the same flush.
 * - A final injection is drained when the stream ends.
 */
export declare function createServerInsertedHTMLTransform(getInsertedHTML: () => string): TransformStream<Uint8Array, Uint8Array>;
export {};
//# sourceMappingURL=streams.d.ts.map