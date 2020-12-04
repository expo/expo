import { PermissionResponse, PermissionStatus } from 'unimodules-permissions-interface';
import { v4 } from 'uuid';

import {
  ImagePickerResult,
  MediaTypeOptions,
  OpenFileBrowserOptions,
  ImagePickerMultipleResult,
  ImageInfo,
  ExpandImagePickerResult,
} from './ImagePicker.types';

const MediaTypeInput = {
  [MediaTypeOptions.All]: 'video/mp4,video/quicktime,video/x-m4v,video/*,image/*',
  [MediaTypeOptions.Images]: 'image/*',
  [MediaTypeOptions.Videos]: 'video/mp4,video/quicktime,video/x-m4v,video/*',
};

export default {
  get name(): string {
    return 'ExponentImagePicker';
  },

  async launchImageLibraryAsync({
    mediaTypes = MediaTypeOptions.Images,
    allowsMultipleSelection = false,
  }): Promise<ImagePickerResult | ImagePickerMultipleResult> {
    return await openFileBrowserAsync({
      mediaTypes,
      allowsMultipleSelection,
    });
  },

  async launchCameraAsync({
    mediaTypes = MediaTypeOptions.Images,
    allowsMultipleSelection = false,
  }): Promise<ImagePickerResult | ImagePickerMultipleResult> {
    return await openFileBrowserAsync({
      mediaTypes,
      allowsMultipleSelection,
      capture: true,
    });
  },

  /*
   * Delegate to expo-permissions to request camera permissions
   */
  async getCameraPermissionsAsync() {
    return permissionGrantedResponse();
  },
  async requestCameraPermissionsAsync() {
    return permissionGrantedResponse();
  },

  /*
   * Camera roll permissions don't need to be requested on web, so we always
   * respond with granted.
   */
  async getMediaLibraryPermissionsAsync(_writeOnly: boolean) {
    return permissionGrantedResponse();
  },
  async requestMediaLibraryPermissionsAsync(_writeOnly: boolean): Promise<PermissionResponse> {
    return permissionGrantedResponse();
  },
};

function permissionGrantedResponse(): PermissionResponse {
  return {
    status: PermissionStatus.GRANTED,
    expires: 'never',
    granted: true,
    canAskAgain: true,
  };
}

function openFileBrowserAsync<T extends OpenFileBrowserOptions>({
  mediaTypes,
  capture = false,
  allowsMultipleSelection = false,
}: T): Promise<ExpandImagePickerResult<T>> {
  const mediaTypeFormat = MediaTypeInput[mediaTypes];

  const input = document.createElement('input');
  input.style.display = 'none';
  input.setAttribute('type', 'file');
  input.setAttribute('accept', mediaTypeFormat);
  input.setAttribute('id', v4());
  if (allowsMultipleSelection) {
    input.setAttribute('multiple', 'multiple');
  }
  if (capture) {
    input.setAttribute('capture', 'camera');
  }
  document.body.appendChild(input);

  return new Promise((resolve, reject) => {
    input.addEventListener('change', async () => {
      if (input.files) {
        if (!allowsMultipleSelection) {
          const img: ImageInfo = await readFile(input.files[0]);
          resolve({
            cancelled: false,
            ...img,
          } as ExpandImagePickerResult<T>);
        } else {
          const imgs: ImageInfo[] = await Promise.all(Array.from(input.files).map(readFile));
          resolve({
            cancelled: false,
            selected: imgs,
          } as ExpandImagePickerResult<T>);
        }
      } else {
        resolve({ cancelled: true } as ExpandImagePickerResult<T>);
      }
      document.body.removeChild(input);
    });

    const event = new MouseEvent('click');
    input.dispatchEvent(event);
  });
}

function readFile(targetFile: Blob): Promise<ImageInfo> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => {
      reject(new Error(`Failed to read the selected media because the operation failed.`));
    };
    reader.onload = ({ target }) => {
      const uri = (target as any).result;
      const returnRaw = () =>
        resolve({
          uri,
          width: 0,
          height: 0,
        });

      if (typeof target?.result === 'string') {
        const image = new Image();
        image.src = target.result;
        image.onload = () =>
          resolve({
            uri,
            width: image.naturalWidth ?? image.width,
            height: image.naturalHeight ?? image.height,
          });
        image.onerror = () => returnRaw();
      } else {
        returnRaw();
      }
    };

    reader.readAsDataURL(targetFile);
  });
}
