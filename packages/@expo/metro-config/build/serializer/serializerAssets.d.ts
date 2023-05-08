export type SerialAsset = {
    originFilename: string;
    filename: string;
    source: string;
    type: 'css' | 'js' | 'map';
    metadata: Record<string, string>;
};
