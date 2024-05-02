import { PermissionResponse, PermissionStatus } from 'expo-modules-core';

import { MediaTypeObject, SortByObject } from './MediaLibrary';

const noPermissionResponse: PermissionResponse = {
  status: PermissionStatus.UNDETERMINED,
  canAskAgain: true,
  granted: false,
  expires: 'never',
};

export default {
  get CHANGE_LISTENER_NAME(): string {
    return 'mediaLibraryDidChange';
  },
  get MediaType(): MediaTypeObject {
    return {
      audio: 'audio',
      photo: 'photo',
      video: 'video',
      unknown: 'unknown',
    };
  },
  get SortBy(): SortByObject {
    return {
      default: 'default',
      mediaType: 'mediaType',
      width: 'width',
      height: 'height',
      creationTime: 'creationTime',
      modificationTime: 'modificationTime',
      duration: 'duration',
    };
  },

  async getPermissionsAsync(_writeOnly: boolean): Promise<PermissionResponse> {
    return noPermissionResponse;
  },
  async requestPermissionsAsync(_writeOnly: boolean): Promise<PermissionResponse> {
    return noPermissionResponse;
  },
};
