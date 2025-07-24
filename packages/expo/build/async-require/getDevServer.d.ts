declare const getDevServer: () => {
    bundleLoadedFromServer: boolean;
    /** URL but ensures that platform query param is added. */
    readonly fullBundleUrl: string;
    url: string;
};
export default getDevServer;
//# sourceMappingURL=getDevServer.d.ts.map