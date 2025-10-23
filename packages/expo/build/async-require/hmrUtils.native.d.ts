export declare function showLoading(message: string, type: 'load' | 'refresh'): void;
export declare function hideLoading(): void;
export declare function resetErrorOverlay(): void;
export declare function reload(): void;
export declare function getFullBundlerUrl({ serverScheme, serverHost, bundleEntry, platform, }: {
    serverScheme: string;
    serverHost: string;
    bundleEntry: string;
    platform: string;
}): string;
export declare function getConnectionError(serverHost: string, e: Error): string;
export declare function handleCompileError(cause: any): void;
//# sourceMappingURL=hmrUtils.native.d.ts.map