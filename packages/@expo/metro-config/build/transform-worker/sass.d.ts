export declare function matchSass(filename: string): import('sass').Syntax | null;
export declare function compileSass(projectRoot: string, { src }: {
    filename: string;
    src: string;
}, options?: Record<string, any>): {
    src: string;
    map: any;
};
