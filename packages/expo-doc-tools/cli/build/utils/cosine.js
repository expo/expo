"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cosineSimilarity = cosineSimilarity;
// Utility to compute cosine similarity between two vectors
function cosineSimilarity(a, b) {
    if (a.length !== b.length)
        throw new Error('Vectors must be the same length');
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
//# sourceMappingURL=cosine.js.map