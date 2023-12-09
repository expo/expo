import { Platform } from 'expo-modules-core';
import { PixelRatio, NativeModules } from 'react-native';
import AssetSourceResolver from './AssetSourceResolver';
import { getManifest, getManifest2, manifestBaseUrl } from './PlatformUtils';
// Fast lookup check if asset map has any overrides in the manifest.
// This value will always be either null or an absolute URL, e.g. `https://expo.dev/`
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
    const hash = meta.fileHashes ? meta.fileHashes[index] ?? meta.fileHashes[0] : meta.hash;
    // Allow asset processors to directly provide the URL to load
    const uri = meta.fileUris ? meta.fileUris[index] ?? meta.fileUris[0] : meta.uri;
    if (uri) {
        return { uri: resolveUri(uri), hash };
    }
    // Check if the assetUrl was overridden in the manifest
    const assetUrlOverride = getManifest().assetUrlOverride;
    if (assetUrlOverride) {
        const uri = pathJoin(assetUrlOverride, hash);
        return { uri: resolveUri(uri), hash };
    }
    const fileScale = scale === 1 ? '' : `@${scale}x`;
    const fileExtension = meta.type ? `.${encodeURIComponent(meta.type)}` : '';
    const suffix = `/${encodeURIComponent(meta.name)}${fileScale}${fileExtension}`;
    const params = new URLSearchParams({
        platform: Platform.OS,
        hash: meta.hash,
    });
    // For assets with a specified absolute URL, we use the existing origin instead of prepending the
    // development server or production CDN URL origin
    if (/^https?:\/\//.test(meta.httpServerLocation)) {
        const uri = meta.httpServerLocation + suffix + '?' + params;
        return { uri, hash };
    }
    // For assets during development using manifest2, we use the development server's URL origin
    const manifest2 = getManifest2();
    const devServerUrl = manifest2?.extra?.expoGo?.developer
        ? 'http://' + manifest2.extra.expoGo.debuggerHost
        : // For assets during development, we use the development server's URL origin
            getManifest().developer
                ? getManifest().bundleUrl
                : null;
    if (devServerUrl) {
        const baseUrl = new URL(meta.httpServerLocation + suffix, devServerUrl);
        baseUrl.searchParams.set('platform', Platform.OS);
        baseUrl.searchParams.set('hash', meta.hash);
        return {
            uri: baseUrl.href,
            hash,
        };
    }
    // Temporary fallback for loading assets in Expo Go home
    if (NativeModules.ExponentKernel) {
        return { uri: `https://classic-assets.eascdn.net/~assets/${encodeURIComponent(hash)}`, hash };
    }
    // In correctly configured apps, we arrive here if the asset is locally available on disk due to
    // being managed by expo-updates, and `getLocalAssetUri(hash)` must return a local URI for this
    // hash. Since the asset is local, we don't have a remote URL and specify an invalid URL (an empty
    // string) as a placeholder.
    return { uri: '', hash };
}
/**
 * Resolves the given URI to an absolute URI. If the given URI is already an absolute URI, it is
 * simply returned. Otherwise, if it is a relative URI, it is resolved relative to the manifest's
 * base URI.
 */
export function resolveUri(uri) {
    // `manifestBaseUrl` is always an absolute URL or `null`.
    return manifestBaseUrl ? new URL(uri, manifestBaseUrl).href : uri;
}
// A very cheap path canonicalization like path.join but without depending on a `path` polyfill.
export function pathJoin(...paths) {
    // Start by simply combining paths, without worrying about ".." or "."
    const combined = paths
        .map((part, index) => {
        if (index === 0) {
            return part.trim().replace(/\/*$/, '');
        }
        return part.trim().replace(/(^\/*|\/*$)/g, '');
    })
        .filter((part) => part.length > 0)
        .join('/')
        .split('/');
    // Handle ".." and "." in paths
    const resolved = [];
    for (const part of combined) {
        if (part === '..') {
            resolved.pop(); // Remove the last element from the result
        }
        else if (part !== '.') {
            resolved.push(part);
        }
    }
    return resolved.join('/');
}
//# sourceMappingURL=AssetSources.js.map