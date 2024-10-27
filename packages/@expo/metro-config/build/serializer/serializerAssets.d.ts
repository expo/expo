export type SerialAsset = {
    originFilename: string;
    filename: string;
    source: string;
    type: 'css-external' | 'css' | 'js' | 'map' | 'json';
    metadata: {
        hmrId?: string;
        isAsync?: boolean;
        modulePaths?: string[];
        paths?: Record<string, Record<string, string>>;
        reactServerReferences?: string[];
        reactClientReferences?: string[];
        expoDomComponentReferences?: string[];
        requires?: string[];
    };
};
