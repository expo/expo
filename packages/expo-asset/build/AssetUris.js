import URL from 'url-parse';
export function getFilename(url) {
    const { pathname } = new URL(url, {});
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
 * For an Expo-hosted project with a manifest hosted at https://expo.io/@user/project/index.exp, the
 * base URL would be https://expo.io/@user/project.
 *
 * We also normalize the "exp" protocol to "http" to handle internal URLs with the Expo schemes used
 * to tell the OS to open the URLs in the the Expo client.
 */
export function getManifestBaseUrl(manifestUrl) {
    const urlObject = new URL(manifestUrl, {});
    // Change the scheme to http(s) if it is exp(s)
    if (urlObject.protocol === 'exp:') {
        urlObject.set('protocol', 'http:');
    }
    else if (urlObject.protocol === 'exps:') {
        urlObject.set('protocol', 'https:');
    }
    // Trim filename, query parameters, and fragment, if any
    const directory = urlObject.pathname.substring(0, urlObject.pathname.lastIndexOf('/') + 1);
    urlObject.set('pathname', directory);
    urlObject.set('query', '');
    urlObject.set('hash', '');
    return urlObject.href;
}
//# sourceMappingURL=AssetUris.js.map