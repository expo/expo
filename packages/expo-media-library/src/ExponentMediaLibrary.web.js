// @flow

export default {
  get name() {
    return 'ExponentMediaLibrary';
  },
  get CHANGE_LISTENER_NAME() {
    return 'mediaLibraryDidChange';
  },
  get MediaType() {
    return {
      audio: 'audio',
      photo: 'photo',
      video: 'video',
      unknown: 'unknown',
    };
  },
  get SortBy() {
    return {
      default: 'default',
      id: 'id',
      mediaType: 'mediaType',
      width: 'width',
      height: 'height',
      creationTime: 'creationTime',
      modificationTime: 'modificationTime',
      duration: 'duration',
    };
  },
  async createAssetAsync(localUri) {},
  async addAssetsToAlbumAsync(assetIds, albumId) {},
  async removeAssetsFromAlbumAsync(assetIds, albumId) {},
  async deleteAssetsAsync(assetIds) {},
  async getAssetInfoAsync(assetId) {},
  async getAlbumsAsync() {},
  async getAlbumAsync(title) {},
  async deleteAlbumsAsync(albumIds) {},
  async getAssetsAsync(options) {},
};
