import fs from 'fs';

import { cosineSimilarity } from '../utils/cosine';

export type Metadata = {
  title: string;
  description: string;
  sourceCodeUrl: string;
  packageName: string;
  iconUrl: string;
  platforms: ('android' | 'ios*' | 'web')[];
  isDeprecated?: boolean;
};

class VectorDb {
  private documents: Map<string, any>;

  constructor() {
    this.documents = new Map();
  }

  addDocument(id: string, content: { metadata: any; content: string; embedding: number[] }): void {
    this.documents.set(id, content);
  }

  getDocument(id: string): any | undefined {
    return this.documents.get(id);
  }

  search(
    queryEmbedding: number[],
    topK: number = 5
  ): {
    id: string;
    score: number;
    metadata: Metadata & { url: string };
    content: string;
  }[] {
    const results: {
      id: string;
      score: number;
      metadata: Metadata & { url: string };
      content: string;
    }[] = [];
    for (const [id, doc] of this.documents.entries()) {
      const score = cosineSimilarity(queryEmbedding, doc.embedding);
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

  async saveToFile(filePath: string): Promise<VectorDb> {
    const obj = Object.fromEntries(this.documents.entries());
    console.log(`Vector database saved to ${filePath} with ${this.documents.size} documents.`);
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), 'utf-8');
    return this;
  }

  async loadFromFile(filePath: string): Promise<VectorDb | undefined> {
    if (!fs.existsSync(filePath)) return;
    const data = await fs.promises.readFile(filePath, 'utf-8');
    const obj = JSON.parse(data);
    this.documents = new Map(Object.entries(obj));
    return this;
  }
}

export default VectorDb;
