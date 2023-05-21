export type SerialAsset = {
    originFilename: string;
    filename: string;
    source: string;
    type: 'css' | 'js' | 'json';
    metadata: Record<string, string>;
};
