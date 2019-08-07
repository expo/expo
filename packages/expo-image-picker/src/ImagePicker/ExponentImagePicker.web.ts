import uuidv4 from 'uuid/v4';

import {
  ImagePickerResult,
  MediaTypeOptions,
  OpenFileBrowserOptions,
  ImagePickerOptions,
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
    mediaTypes = MediaTypeOptions.All,
    allowsMultipleSelection = false,
  }: ImagePickerOptions): Promise<ImagePickerResult> {
    return await openFileBrowserAsync({
      mediaTypes,
      allowsMultipleSelection,
    });
  },
  async launchCameraAsync({
    mediaTypes = MediaTypeOptions.All,
    allowsMultipleSelection = false,
  }: ImagePickerOptions): Promise<ImagePickerResult> {
    return await openFileBrowserAsync({
      mediaTypes,
      allowsMultipleSelection,
      capture: true,
    });
  },
};

function openFileBrowserAsync({
  mediaTypes,
  capture = false,
  allowsMultipleSelection = false,
}: OpenFileBrowserOptions): Promise<ImagePickerResult> {
  const mediaTypeFormat = MediaTypeInput[mediaTypes];

  const input = document.createElement('input');
  input.style.display = 'none';
  input.setAttribute('type', 'file');
  input.setAttribute('accept', mediaTypeFormat);
  input.setAttribute('id', uuidv4());
  if (allowsMultipleSelection) {
    input.setAttribute('multiple', 'multiple');
  }
  if (capture) {
    input.setAttribute('capture', 'camera');
  }
  document.body.appendChild(input);

  return new Promise((resolve, reject) => {
    input.addEventListener('change', () => {
      if (input.files) {
        const targetFile = input.files[0];
        const reader = new FileReader();
        reader.onerror = () => {
          reject('Failed to read the selected media because the operation failed.');
        };
        reader.onload = ({ target }) => {
          const uri = (target as any).result;
          resolve({
            cancelled: false,
            uri,
            width: 0,
            height: 0,
          });
        };
        // Read in the image file as a binary string.
        reader.readAsDataURL(targetFile);
      } else {
        resolve({ cancelled: true });
      }

      document.body.removeChild(input);
    });

    const event = new MouseEvent('click');
    input.dispatchEvent(event);
  });
}
