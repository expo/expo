import { PermissionResponse, PermissionStatus } from 'unimodules-permissions-interface';

const noPermissionResponse: PermissionResponse = {
  status: PermissionStatus.UNDETERMINED,
  canAskAgain: true,
  granted: false,
  expires: 'never',
};

export default {
  get name(): string {
    return 'ExponentMediaLibrary';
  },
  get CHANGE_LISTENER_NAME(): string {
    return 'mediaLibraryDidChange';
  },
  get MediaType(): { [key: string]: string } {
    return {
      audio: 'audio',
      photo: 'photo',
      video: 'video',
      unknown: 'unknown',
    };
  },
  get SortBy(): { [key: string]: string } {
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

  async getPermissionsAsync(): Promise<PermissionResponse> {
    return noPermissionResponse;
  },
  async requestPermissionsAsync(): Promise<PermissionResponse> {
    return noPermissionResponse;
  },
};
