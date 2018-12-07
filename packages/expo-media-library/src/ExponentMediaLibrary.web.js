// @flow

export default {
  get name(): string {
    return 'ExponentMediaLibrary';
  },
  get CHANGE_LISTENER_NAME(): string {
    return 'mediaLibraryDidChange';
  },
  get MediaType(): { [string]: string } {
    return {
      audio: 'audio',
      photo: 'photo',
      video: 'video',
      unknown: 'unknown',
    };
  },
  get SortBy(): { [string]: string } {
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
};
