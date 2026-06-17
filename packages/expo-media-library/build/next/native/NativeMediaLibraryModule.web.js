import { PermissionStatus } from 'expo';
import { UnavailabilityError } from 'expo-modules-core';
const noPermissionResponse = {
    status: PermissionStatus.UNDETERMINED,
    canAskAgain: true,
    granted: false,
    expires: 'never',
};
function unavailable(methodName) {
    throw new UnavailabilityError('MediaLibrary', methodName);
}
class NativeAssetWeb {
    id;
    constructor(id) {
        this.id = id;
    }
    getCreationTime() {
        return unavailable('Asset.getCreationTime');
    }
    getDuration() {
        return unavailable('Asset.getDuration');
    }
    getFilename() {
        return unavailable('Asset.getFilename');
    }
    getHeight() {
        return unavailable('Asset.getHeight');
    }
    getMediaType() {
        return unavailable('Asset.getMediaType');
    }
    getMediaSubtypes() {
        return unavailable('Asset.getMediaSubtypes');
    }
    getLivePhotoVideoUri() {
        return unavailable('Asset.getLivePhotoVideoUri');
    }
    getIsInCloud() {
        return unavailable('Asset.getIsInCloud');
    }
    getOrientation() {
        return unavailable('Asset.getOrientation');
    }
    getModificationTime() {
        return unavailable('Asset.getModificationTime');
    }
    getShape() {
        return unavailable('Asset.getShape');
    }
    getUri() {
        return unavailable('Asset.getUri');
    }
    getWidth() {
        return unavailable('Asset.getWidth');
    }
    getInfo() {
        return unavailable('Asset.getInfo');
    }
    getAlbums() {
        return unavailable('Asset.getAlbums');
    }
    getLocation() {
        return unavailable('Asset.getLocation');
    }
    getExif() {
        return unavailable('Asset.getExif');
    }
    delete() {
        return unavailable('Asset.delete');
    }
    getFavorite() {
        return unavailable('Asset.getFavorite');
    }
    setFavorite(_isFavorite) {
        return unavailable('Asset.setFavorite');
    }
    static create(_filePath, _album) {
        return unavailable('Asset.create');
    }
    static delete(_assets) {
        return unavailable('Asset.delete');
    }
}
class NativeAlbumWeb {
    id;
    constructor(id) {
        this.id = id;
    }
    getAssets() {
        return unavailable('Album.getAssets');
    }
    getTitle() {
        return unavailable('Album.getTitle');
    }
    delete() {
        return unavailable('Album.delete');
    }
    add(_assets) {
        return unavailable('Album.add');
    }
    removeAssets(_assets) {
        return unavailable('Album.removeAssets');
    }
    static create(_name, _assetsRefs, _moveAssets) {
        return unavailable('Album.create');
    }
    static delete(_albums, _deleteAssets) {
        return unavailable('Album.delete');
    }
    static get(_title) {
        return unavailable('Album.get');
    }
    static getAll() {
        return unavailable('Album.getAll');
    }
}
class NativeQueryWeb {
    eq(_field, _value) {
        return this;
    }
    within(_field, _value) {
        return this;
    }
    gt(_field, _value) {
        return this;
    }
    gte(_field, _value) {
        return this;
    }
    lt(_field, _value) {
        return this;
    }
    lte(_field, _value) {
        return this;
    }
    limit(_limit) {
        return this;
    }
    offset(_offset) {
        return this;
    }
    orderBy(_sortDescriptors) {
        return this;
    }
    album(_album) {
        return this;
    }
    exe() {
        return unavailable('Query.exe');
    }
    exeForMetadata() {
        return unavailable('Query.exeForMetadata');
    }
}
export const NativeMediaLibraryModule = {
    Asset: NativeAssetWeb,
    Album: NativeAlbumWeb,
    Query: NativeQueryWeb,
    getPermissionsAsync(_writeOnly, _granularPermissions) {
        return Promise.resolve(noPermissionResponse);
    },
    requestPermissionsAsync(_writeOnly, _granularPermissions) {
        return Promise.resolve(noPermissionResponse);
    },
    presentPermissionsPicker(_mediaTypes) {
        return unavailable('presentPermissionsPicker');
    },
    addListener(_eventName, _listener) {
        return { remove() { } };
    },
    removeAllListeners(_eventName) { },
};
export const NativeAsset = NativeMediaLibraryModule.Asset;
export const NativeAlbum = NativeMediaLibraryModule.Album;
export const NativeQuery = NativeMediaLibraryModule.Query;
//# sourceMappingURL=NativeMediaLibraryModule.web.js.map