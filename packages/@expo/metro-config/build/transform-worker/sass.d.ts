/// <reference types="source-map-js" />
export declare function matchSass(filename: string): import('sass').Syntax | null;
export declare function compileSass(projectRoot: string, { filename, src }: {
    filename: string;
    src: string;
}, options?: Partial<import('sass').StringOptions<'sync'>>): {
    src: string;
    map: import("source-map-js").RawSourceMap | undefined;
};
