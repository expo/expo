export type SerialAsset = {
    originFilename: string;
    filename: string;
    source: string;
    type: 'css' | 'js' | 'map' | 'json';
    metadata: {
        hmrId?: string;
        isAsync?: boolean;
        modulePaths?: string[];
        paths?: Record<string, Record<string, string>>;
        reactClientReferences?: string[];
        requires?: string[];
    };
};
