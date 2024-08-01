interface HermesBundleOutput {
    hbc: Uint8Array;
    sourcemap: string | null;
}
type BuildHermesOptions = {
    filename: string;
    code: string;
    map: string | null;
    minify?: boolean;
};
export declare function buildHermesBundleAsync(options: BuildHermesOptions): Promise<HermesBundleOutput>;
export {};
