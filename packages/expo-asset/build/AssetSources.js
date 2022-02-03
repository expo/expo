import { Platform } from 'expo-modules-core';
import path from 'path-browserify';
import { PixelRatio } from 'react-native';
import URL from 'url-parse';
import AssetSourceResolver from './AssetSourceResolver';
import { manifestBaseUrl, getManifest, getManifest2 } from './PlatformUtils';
// Fast lookup check if asset map has any overrides in the manifest
const assetMapOverride = getManifest().assetMapOverride;
/**
 * Selects the best file for the given asset (ex: choosing the best scale for images) and returns
 * a { uri, hash } pair for the specific asset file.
 *
 * If the asset isn't an image with multiple scales, the first file is selected.
 */
export function selectAssetSource(meta) {
    // Override with the asset map in manifest if available
    if (assetMapOverride && assetMapOverride.hasOwnProperty(meta.hash)) {
        meta = { ...meta, ...assetMapOverride[meta.hash] };
    }
    // This logic is based on that of AssetSourceResolver, with additional support for file hashes and
    // explicitly provided URIs
    const scale = AssetSourceResolver.pickScale(meta.scales, PixelRatio.get());
    const index = meta.scales.findIndex((s) => s === scale);
    const hash = meta.fileHashes ? meta.fileHashes[index] || meta.fileHashes[0] : meta.hash;
    // Allow asset processors to directly provide the URL to load
    const uri = meta.fileUris ? meta.fileUris[index] || meta.fileUris[0] : meta.uri;
    if (uri) {
        return { uri: resolveUri(uri), hash };
    }
    // Check if the assetUrl was overridden in the manifest
    const assetUrlOverride = getManifest().assetUrlOverride;
    if (assetUrlOverride) {
        const uri = path.join(assetUrlOverride, hash);
        return { uri: resolveUri(uri), hash };
    }
    const fileScale = scale === 1 ? '' : `@${scale}x`;
    const fileExtension = meta.type ? `.${encodeURIComponent(meta.type)}` : '';
    const suffix = `/${encodeURIComponent(meta.name)}${fileScale}${fileExtension}?platform=${encodeURIComponent(Platform.OS)}&hash=${encodeURIComponent(meta.hash)}`;
    // For assets with a specified absolute URL, we use the existing origin instead of prepending the
    // development server or production CDN URL origin
    if (/^https?:\/\//.test(meta.httpServerLocation)) {
        const uri = meta.httpServerLocation + suffix;
        return { uri, hash };
    }
    // For assets during development using manifest2, we use the development server's URL origin
    const manifest2 = getManifest2();
    if (manifest2?.extra?.expoGo?.developer) {
        const baseUrl = new URL(`http://${manifest2.extra.expoGo.debuggerHost}`);
        baseUrl.set('pathname', meta.httpServerLocation + suffix);
        return {
            uri: baseUrl.href,
            hash,
        };
    }
    // For assets during development, we use the development server's URL origin
    if (getManifest().developer) {
        const baseUrl = new URL(getManifest().bundleUrl);
        baseUrl.set('pathname', meta.httpServerLocation + suffix);
        return { uri: baseUrl.href, hash };
    }
    // Production CDN URIs are based on each asset file hash
    return {
        uri: `https://classic-assets.eascdn.net/~assets/${encodeURIComponent(hash)}`,
        hash,
    };
}
/**
 * Resolves the given URI to an absolute URI. If the given URI is already an absolute URI, it is
 * simply returned. Otherwise, if it is a relative URI, it is resolved relative to the manifest's
 * base URI.
 */
export function resolveUri(uri) {
    if (!manifestBaseUrl) {
        return uri;
    }
    const { protocol } = new URL(uri);
    if (protocol !== '') {
        return uri;
    }
    const baseUrl = new URL(manifestBaseUrl);
    const resolvedPath = uri.startsWith('/') ? uri : path.join(baseUrl.pathname, uri);
    baseUrl.set('pathname', resolvedPath);
    return baseUrl.href;
}
//# sourceMappingURL=AssetSources.js.map