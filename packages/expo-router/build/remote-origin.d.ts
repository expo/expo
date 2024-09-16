type RemoteServer = {
    getDefault: () => string | null;
    getCurrent: () => string | null;
    prompt: typeof promptChangeServer;
    /** Reset the remote  */
    reset: () => void;
};
declare global {
    /** The client-side controller for the remote server that is used for interacting with SSR. This is useful for testing different servers against production builds. Although, this should never be used in production apps with arbitrary users as it could be leveraged by malicious actors to change the remote server connected to a native client (your app), which has access to sensitive data. */
    var remote: RemoteServer | undefined;
}
export declare function promptChangeServer(currentUrl?: string | null, placeholder?: string): void;
export declare function useRemoteOriginDevTool(): void;
export {};
//# sourceMappingURL=remote-origin.d.ts.map