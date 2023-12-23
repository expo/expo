export function getFilename(url) {
    const { pathname, searchParams } = new URL(url, 'https://e');
    // When attached to a dev server, we use `unstable_path` to represent the file path. This ensures
    // the file name is not canonicalized by the browser.
    // NOTE(EvanBacon): This is technically not tied to `__DEV__` as it's possible to use this while bundling in production
    // mode.
    if (__DEV__) {
        if (searchParams.has('unstable_path')) {
            const encodedFilePath = decodeURIComponent(searchParams.get('unstable_path'));
            return getBasename(encodedFilePath);
        }
    }
    return getBasename(pathname);
}
function getBasename(pathname) {
    return pathname.substring(pathname.lastIndexOf('/') + 1);
}
export function getFileExtension(url) {
    const filename = getFilename(url);
    const dotIndex = filename.lastIndexOf('.');
    // Ignore leading dots for hidden files
    return dotIndex > 0 ? filename.substring(dotIndex) : '';
}
/**
 * Returns the base URL from a manifest's URL. For example, given a manifest hosted at
 * https://example.com/app/manifest.json, the base URL would be https://example.com/app/. Query
 * parameters and fragments also are removed.
 *
 * For an Expo-hosted project with a manifest hosted at https://exp.host/@user/project/index.exp, the
 * base URL would be https://exp.host/@user/project.
 *
 * We also normalize the "exp" protocol to "http" to handle internal URLs with the Expo schemes used
 * to tell the OS to open the URLs in the the Expo client.
 */
export function getManifestBaseUrl(manifestUrl) {
    const urlObject = new URL(manifestUrl);
    let nextProtocol = urlObject.protocol;
    // Change the scheme to http(s) if it is exp(s)
    if (nextProtocol === 'exp:') {
        nextProtocol = 'http:';
    }
    else if (nextProtocol === 'exps:') {
        nextProtocol = 'https:';
    }
    urlObject.protocol = nextProtocol;
    // Trim filename, query parameters, and fragment, if any
    const directory = urlObject.pathname.substring(0, urlObject.pathname.lastIndexOf('/') + 1);
    urlObject.pathname = directory;
    urlObject.search = '';
    urlObject.hash = '';
    // The URL spec doesn't allow for changing the protocol to `http` or `https`
    // without a port set so instead, we'll just swap the protocol manually.
    return urlObject.protocol !== nextProtocol
        ? urlObject.href.replace(urlObject.protocol, nextProtocol)
        : urlObject.href;
}
//# sourceMappingURL=AssetUris.js.map