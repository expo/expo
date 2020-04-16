import { Platform } from '@unimodules/core';
import { getAssetByID } from './AssetRegistry';
import * as AssetSources from './AssetSources';
import * as AssetUris from './AssetUris';
import { getEmbeddedAssetUri } from './EmbeddedAssets';
import * as ImageAssets from './ImageAssets';
import { downloadAsync, IS_ENV_WITH_UPDATES_ENABLED } from './PlatformUtils';
import resolveAssetSource from './resolveAssetSource';
export class Asset {
    constructor({ name, type, hash = null, uri, width, height }) {
        this.hash = null;
        this.localUri = null;
        this.width = null;
        this.height = null;
        this.downloading = false;
        this.downloaded = false;
        this._downloadCallbacks = [];
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
        if (hash) {
            this.localUri = getEmbeddedAssetUri(hash, type);
            if (this.localUri) {
                this.downloaded = true;
            }
        }
        if (Platform.OS === 'web') {
            if (!name) {
                this.name = AssetUris.getFilename(uri);
            }
            if (!type) {
                this.type = AssetUris.getFileExtension(uri);
            }
        }
    }
    static loadAsync(moduleId) {
        const moduleIds = Array.isArray(moduleId) ? moduleId : [moduleId];
        return Promise.all(moduleIds.map(moduleId => Asset.fromModule(moduleId).downloadAsync()));
    }
    static fromModule(virtualAssetModule) {
        if (typeof virtualAssetModule === 'string') {
            return Asset.fromURI(virtualAssetModule);
        }
        const meta = getAssetByID(virtualAssetModule);
        if (!meta) {
            throw new Error(`Module "${virtualAssetModule}" is missing from the asset registry`);
        }
        // Outside of the managed env we need the moduleId to initialize the asset
        // because resolveAssetSource depends on it
        if (!IS_ENV_WITH_UPDATES_ENABLED) {
            const { uri } = resolveAssetSource(virtualAssetModule);
            const asset = new Asset({
                name: meta.name,
                type: meta.type,
                hash: meta.hash,
                uri,
                width: meta.width,
                height: meta.height,
            });
            // TODO: FileSystem should probably support 'downloading' from drawable
            // resources But for now it doesn't (it only supports raw resources) and
            // React Native's Image works fine with drawable resource names for
            // images.
            if (Platform.OS === 'android' && !uri.includes(':') && (meta.width || meta.height)) {
                asset.localUri = asset.uri;
                asset.downloaded = true;
            }
            Asset.byHash[meta.hash] = asset;
            return asset;
        }
        return Asset.fromMetadata(meta);
    }
    static fromMetadata(meta) {
        // The hash of the whole asset, not to be confused with the hash of a specific file returned
        // from `selectAssetSource`
        const metaHash = meta.hash;
        if (Asset.byHash[metaHash]) {
            return Asset.byHash[metaHash];
        }
        const { uri, hash } = AssetSources.selectAssetSource(meta);
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
        if (this.downloaded) {
            return;
        }
        if (this.downloading) {
            await new Promise((resolve, reject) => {
                this._downloadCallbacks.push({ resolve, reject });
            });
            return;
        }
        this.downloading = true;
        try {
            if (Platform.OS === 'web') {
                if (ImageAssets.isImageType(this.type)) {
                    const { width, height, name } = await ImageAssets.getImageInfoAsync(this.uri);
                    this.width = width;
                    this.height = height;
                    this.name = name;
                }
                else {
                    this.name = AssetUris.getFilename(this.uri);
                }
            }
            this.localUri = await downloadAsync(this.uri, this.hash, this.type, this.name);
            this.downloaded = true;
            this._downloadCallbacks.forEach(({ resolve }) => resolve());
        }
        catch (e) {
            this._downloadCallbacks.forEach(({ reject }) => reject(e));
            throw e;
        }
        finally {
            this.downloading = false;
            this._downloadCallbacks = [];
        }
    }
}
Asset.byHash = {};
Asset.byUri = {};
//# sourceMappingURL=Asset.js.map