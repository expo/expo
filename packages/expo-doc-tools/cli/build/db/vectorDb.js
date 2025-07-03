"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const cosine_1 = require("../utils/cosine");
class VectorDb {
    documents;
    constructor() {
        this.documents = new Map();
    }
    addDocument(id, content) {
        this.documents.set(id, content);
    }
    getDocument(id) {
        return this.documents.get(id);
    }
    search(queryEmbedding, topK = 5) {
        const results = [];
        for (const [id, doc] of this.documents.entries()) {
            const score = (0, cosine_1.cosineSimilarity)(queryEmbedding, doc.embedding);
            results.push({
                id,
                score,
                metadata: {
                    ...doc.metadata,
                    url: `https://docs.expo.dev/versions/latest/sdk/${id.replace('.mdx', '')}`,
                },
                content: doc.content,
            });
        }
        // Sort by score and filter out deprecated documents
        // Also limit to topK results
        return results
            .sort((a, b) => b.score - a.score)
            .filter((r) => r.metadata.isDeprecated !== true)
            .slice(0, topK);
    }
    async saveToFile(filePath) {
        const obj = Object.fromEntries(this.documents.entries());
        console.log(`Vector database saved to ${filePath} with ${this.documents.size} documents.`);
        fs_1.default.writeFileSync(filePath, JSON.stringify(obj, null, 2), 'utf-8');
        return this;
    }
    async loadFromFile(filePath) {
        if (!fs_1.default.existsSync(filePath))
            return;
        const data = await fs_1.default.promises.readFile(filePath, 'utf-8');
        const obj = JSON.parse(data);
        this.documents = new Map(Object.entries(obj));
        return this;
    }
}
exports.default = VectorDb;
//# sourceMappingURL=vectorDb.js.map