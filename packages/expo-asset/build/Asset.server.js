import * as AssetUris from './AssetUris';
import * as ImageAssets from './ImageAssets';
export class Asset {
    static byHash = {};
    static byUri = {};
    name;
    type;
    hash = null;
    uri;
    localUri = null;
    width = null;
    height = null;
    downloaded = true;
    constructor({ name, type, hash = null, uri, width, height }) {
        this.name = name;
        this.type = type;
        this.hash = hash;
        this.uri = uri;
        if (typeof width === 'number') {
            this.width = width;
        }
        if (typeof height === 'number') {
            this.height = height;
        }
        this.name ??= AssetUris.getFilename(uri);
        this.type ??= AssetUris.getFileExtension(uri);
        // Essentially run the contents of downloadAsync here.
        if (ImageAssets.isImageType(this.type)) {
            this.width = 0;
            this.height = 0;
            this.name = AssetUris.getFilename(this.uri);
        }
        else {
            this.name = AssetUris.getFilename(this.uri);
        }
        this.localUri = this.uri;
    }
    static loadAsync(moduleId) {
        const moduleIds = Array.isArray(moduleId) ? moduleId : [moduleId];
        return Promise.all(moduleIds.map((moduleId) => Asset.fromModule(moduleId).downloadAsync()));
    }
    static fromModule(virtualAssetModule) {
        if (typeof virtualAssetModule === 'string') {
            return Asset.fromURI(virtualAssetModule);
        }
        else if (typeof virtualAssetModule === 'number') {
            throw new Error('Cannot resolve numeric asset IDs on the server as they are non-deterministic identifiers.');
        }
        if (typeof virtualAssetModule === 'object' &&
            'uri' in virtualAssetModule &&
            typeof virtualAssetModule.uri === 'string') {
            const extension = AssetUris.getFileExtension(virtualAssetModule.uri);
            return new Asset({
                name: '',
                type: extension.startsWith('.') ? extension.substring(1) : extension,
                hash: null,
                uri: virtualAssetModule.uri,
                width: virtualAssetModule.width,
                height: virtualAssetModule.height,
            });
        }
        throw new Error('Unexpected asset module ID type: ' + typeof virtualAssetModule);
    }
    static fromMetadata(meta) {
        const metaHash = meta.hash;
        const maybeHash = Asset.byHash[metaHash];
        if (maybeHash) {
            return maybeHash;
        }
        const { uri, hash } = selectAssetSource(meta);
        const asset = new Asset({
            name: meta.name,
            type: meta.type,
            hash,
            uri,
            width: meta.width,
            height: meta.height,
        });
        Asset.byHash[metaHash] = asset;
        return asset;
    }
    static fromURI(uri) {
        if (Asset.byUri[uri]) {
            return Asset.byUri[uri];
        }
        // Possibly a Base64-encoded URI
        let type = '';
        if (uri.indexOf(';base64') > -1) {
            type = uri.split(';')[0].split('/')[1];
        }
        else {
            const extension = AssetUris.getFileExtension(uri);
            type = extension.startsWith('.') ? extension.substring(1) : extension;
        }
        const asset = new Asset({
            name: '',
            type,
            hash: null,
            uri,
        });
        Asset.byUri[uri] = asset;
        return asset;
    }
    async downloadAsync() {
        return this;
    }
}
function pickScale(scales, deviceScale) {
    for (let i = 0; i < scales.length; i++) {
        if (scales[i] >= deviceScale) {
            return scales[i];
        }
    }
    return scales[scales.length - 1] || 1;
}
/**
 * Selects the best file for the given asset (ex: choosing the best scale for images) and returns
 * a { uri, hash } pair for the specific asset file.
 *
 * If the asset isn't an image with multiple scales, the first file is selected.
 */
function selectAssetSource(meta) {
    // This logic is based on that of AssetSourceResolver, with additional support for file hashes and
    // explicitly provided URIs
    const scale = pickScale(meta.scales, 1);
    const index = meta.scales.findIndex((s) => s === scale);
    const hash = meta.fileHashes ? (meta.fileHashes[index] ?? meta.fileHashes[0]) : meta.hash;
    // Allow asset processors to directly provide the URL to load
    const uri = meta.fileUris ? (meta.fileUris[index] ?? meta.fileUris[0]) : meta.uri;
    if (uri) {
        return { uri, hash };
    }
    const fileScale = scale === 1 ? '' : `@${scale}x`;
    const fileExtension = meta.type ? `.${encodeURIComponent(meta.type)}` : '';
    const suffix = `/${encodeURIComponent(meta.name)}${fileScale}${fileExtension}`;
    const params = new URLSearchParams({
        platform: process.env.EXPO_OS,
        hash: meta.hash,
    });
    // For assets with a specified absolute URL, we use the existing origin instead of prepending the
    // development server or production CDN URL origin
    if (/^https?:\/\//.test(meta.httpServerLocation)) {
        const uri = meta.httpServerLocation + suffix + '?' + params;
        return { uri, hash };
    }
    // In correctly configured apps, we arrive here if the asset is locally available on disk due to
    // being managed by expo-updates, and `getLocalAssetUri(hash)` must return a local URI for this
    // hash. Since the asset is local, we don't have a remote URL and specify an invalid URL (an empty
    // string) as a placeholder.
    return { uri: '', hash };
}
//# sourceMappingURL=Asset.server.js.map