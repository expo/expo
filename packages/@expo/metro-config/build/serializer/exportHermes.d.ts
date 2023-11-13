interface HermesBundleOutput {
    hbc: Uint8Array;
    sourcemap: string | null;
}
export declare function buildHermesBundleAsync({ code, map, minify, filename, }: {
    filename: string;
    code: string;
    map: string | null;
    minify?: boolean;
}): Promise<HermesBundleOutput>;
export {};
