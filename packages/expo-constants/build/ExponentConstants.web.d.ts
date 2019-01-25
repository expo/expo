declare const _default: {
    readonly name: string;
    readonly appOwnership: string;
    readonly installationId: string | null;
    readonly sessionId: string;
    readonly platform: object;
    readonly isDevice: boolean;
    readonly expoVersion: string;
    readonly linkingUri: string;
    readonly expoRuntimeVersion: string | null;
    readonly deviceName: string | null;
    readonly systemFonts: string[];
    readonly statusBarHeight: number;
    readonly deviceYearClass: string | null;
    readonly manifest: {
        [manifestKey: string]: any;
    };
    getWebViewUserAgentAsync(): Promise<string>;
};
export default _default;
