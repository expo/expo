export type Metadata = {
    title: string;
    description: string;
    sourceCodeUrl: string;
    packageName: string;
    iconUrl: string;
    platforms: ('android' | 'ios*' | 'web')[];
    isDeprecated?: boolean;
};
declare class VectorDb {
    private documents;
    constructor();
    addDocument(id: string, content: {
        metadata: any;
        content: string;
        embedding: number[];
    }): void;
    getDocument(id: string): any | undefined;
    search(queryEmbedding: number[], topK?: number): {
        id: string;
        score: number;
        metadata: Metadata & {
            url: string;
        };
        content: string;
    }[];
    saveToFile(filePath: string): Promise<VectorDb>;
    loadFromFile(filePath: string): Promise<VectorDb | undefined>;
}
export default VectorDb;
