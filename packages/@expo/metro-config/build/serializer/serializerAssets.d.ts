export type SerialAsset = {
    originFilename: string;
    filename: string;
    source: string;
    type: 'css' | 'js';
    metadata: Record<string, string>;
};
