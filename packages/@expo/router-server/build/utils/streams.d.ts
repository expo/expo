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
export {};
//# sourceMappingURL=streams.d.ts.map