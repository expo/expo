export type SerialAsset = {
    originFilename: string;
    filename: string;
    source: string;
    type: 'css-external' | 'css' | 'js' | 'map' | 'json';
    metadata: {
        hmrId?: string;
        /** Media query baked into a `css-external` `<link>` tag (e.g. `screen and (min-width: 900px)`). */
        media?: string;
        isAsync?: boolean;
        modulePaths?: string[];
        paths?: Record<string, Record<string, string>>;
        reactServerReferences?: string[];
        reactClientReferences?: string[];
        expoDomComponentReferences?: string[];
        loaderReferences?: string[];
        requires?: string[];
    };
};
