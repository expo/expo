export type AudioSource = {
    /**
     * A string representing the resource identifier for the audio,
     * which could be an HTTPS address, a local file path, or the name of a static audio file resource.
     */
    uri?: string;
    /**
     * An object representing the HTTP headers to send along with the request for a remote audio source.
     * On web requires the `Access-Control-Allow-Origin` header returned by the server to include the current domain.
     */
    headers?: Record<string, string>;
};
//# sourceMappingURL=Audio.types.d.ts.map