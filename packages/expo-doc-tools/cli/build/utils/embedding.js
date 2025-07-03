"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.embedText = embedText;
let embeddingPipeline = null;
async function embedText(text) {
    if (!embeddingPipeline) {
        const { pipeline } = await import('@xenova/transformers');
        embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    // The pipeline returns [1, N, D] shape, so we flatten to [D]
    const output = await embeddingPipeline(text, {
        pooling: 'mean',
        normalize: true,
    });
    return Array.from(output.data);
}
//# sourceMappingURL=embedding.js.map