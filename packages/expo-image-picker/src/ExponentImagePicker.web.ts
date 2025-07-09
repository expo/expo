import { PermissionResponse, PermissionStatus, Platform } from 'expo-modules-core';

import {
  CameraType,
  ImagePickerAsset,
  ImagePickerOptions,
  ImagePickerResult,
  MediaType,
  OpenFileBrowserOptions,
} from './ImagePicker.types';
import { parseMediaTypes } from './utils';

const MediaTypeInput: Record<MediaType, string> = {
  images: 'image/*',
  videos: 'video/mp4,video/quicktime,video/x-m4v,video/*',
  livePhotos: '',
};

export default {
  async launchImageLibraryAsync({
    mediaTypes = ['images'] as MediaType[],
    allowsMultipleSelection = false,
    base64 = false,
  }: ImagePickerOptions): Promise<ImagePickerResult> {
    // SSR guard
    if (!Platform.isDOMAvailable) {
      return { canceled: true, assets: null };
    }
    return await openFileBrowserAsync({
      mediaTypes,
      allowsMultipleSelection,
      base64,
    });
  },

  async launchCameraAsync({
    mediaTypes = ['images'] as MediaType[],
    allowsMultipleSelection = false,
    base64 = false,
    cameraType,
  }: ImagePickerOptions): Promise<ImagePickerResult> {
    // SSR guard
    if (!Platform.isDOMAvailable) {
      return { canceled: true, assets: null };
    }
    return await openFileBrowserAsync({
      mediaTypes,
      allowsMultipleSelection,
      capture: cameraType ?? true,
      base64,
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

/**
 * Opens a file browser dialog or camera on supported platforms and returns the selected files.
 * Handles both single and multiple file selection.
 */
function openFileBrowserAsync({
  mediaTypes,
  capture = false,
  allowsMultipleSelection = false,
  base64,
}: OpenFileBrowserOptions): Promise<ImagePickerResult> {
  const parsedMediaTypes = parseMediaTypes(mediaTypes);
  const mediaTypeFormat = createMediaTypeFormat(parsedMediaTypes);

  const input = document.createElement('input');
  input.style.display = 'none';
  input.setAttribute('type', 'file');
  input.setAttribute('accept', mediaTypeFormat);
  input.setAttribute('id', String(Math.random()));
  input.setAttribute('data-testid', 'file-input');
  if (allowsMultipleSelection) {
    input.setAttribute('multiple', 'multiple');
  }
  if (capture) {
    switch (capture) {
      case true:
        input.setAttribute('capture', 'camera');
        break;
      case CameraType.front:
        input.setAttribute('capture', 'user');
        break;
      case CameraType.back:
        input.setAttribute('capture', 'environment');
    }
  }
  document.body.appendChild(input);

  return new Promise((resolve) => {
    input.addEventListener('change', async () => {
      if (input.files?.length) {
        const files = allowsMultipleSelection ? input.files : [input.files[0]];
        const assets: ImagePickerAsset[] = await Promise.all(
          Array.from(files).map((file) => readFile(file, { base64 }))
        );

        resolve({ canceled: false, assets });
      } else {
        resolve({ canceled: true, assets: null });
      }
      document.body.removeChild(input);
    });
    input.addEventListener('cancel', () => {
      input.dispatchEvent(new Event('change'));
    });

    const event = new MouseEvent('click');
    input.dispatchEvent(event);
  });
}

/**
 * Gets metadata for an image file using a blob URL
 * TODO (Hirbod): add exif support for feature parity with native
 */
async function getImageMetadata(blobUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      resolve({
        width: image.naturalWidth ?? image.width,
        height: image.naturalHeight ?? image.height,
      });
    };
    image.onerror = () => resolve({ width: 0, height: 0 });
    image.src = blobUrl;
  });
}

/**
 * Gets metadata for a video file using a blob URL
 */
async function getVideoMetadata(
  blobUrl: string
): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
      });
    };
    video.onerror = () => resolve({ width: 0, height: 0, duration: 0 });
    video.src = blobUrl;
  });
}

/**
 * Reads a file as base64
 */
async function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => {
      reject(new Error('Failed to read the selected media because the operation failed.'));
    };
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const result = event.target?.result;
      if (typeof result !== 'string') {
        reject(new Error('Failed to read file as base64'));
        return;
      }
      // Remove the data URL prefix to get just the base64 data
      resolve(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Reads a file and returns its data as an ImagePickerAsset.
 * Handles both base64 and blob URL modes, and extracts metadata for images and videos.
 */
async function readFile(targetFile: File, options: { base64: boolean }): Promise<ImagePickerAsset> {
  const mimeType = targetFile.type;
  const baseUri = URL.createObjectURL(targetFile);

  try {
    let metadata: { width: number; height: number; duration?: number };
    let base64: string | undefined;

    if (mimeType.startsWith('image/')) {
      metadata = await getImageMetadata(baseUri);
    } else if (mimeType.startsWith('video/')) {
      metadata = await getVideoMetadata(baseUri);
    } else {
      throw new Error(`Unsupported file type: ${mimeType}. Only images and videos are supported.`);
    }

    if (options.base64) {
      base64 = await readFileAsBase64(targetFile);
    }

    return {
      uri: baseUri,
      width: metadata.width,
      height: metadata.height,
      type: mimeType.startsWith('image/') ? 'image' : 'video',
      mimeType,
      fileName: targetFile.name,
      fileSize: targetFile.size,
      file: targetFile,
      ...(metadata.duration !== undefined && { duration: metadata.duration }),
      ...(base64 && { base64 }),
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Creates the accept attribute value for the file input based on the requested media types.
 * Filters out livePhotos as they're not supported on web.
 */
function createMediaTypeFormat(mediaTypes: MediaType[]): string {
  const filteredMediaTypes = mediaTypes.filter((mediaType) => mediaType !== 'livePhotos');
  if (filteredMediaTypes.length === 0) {
    return 'image/*';
  }
  let result = '';
  for (const mediaType of filteredMediaTypes) {
    // Make sure the types don't repeat
    if (!result.includes(MediaTypeInput[mediaType])) {
      result = result.concat(',', MediaTypeInput[mediaType]);
    }
  }
  return result;
}
