import uuidv4 from 'uuid/v4';

import { CameraOptions, ImageLibraryOptions, ImageResult } from './ImagePicker.types';
import MediaTypeOptions from './MediaTypeOptions';

const MediaTypeInput = {
  [MediaTypeOptions.All]: 'video/*,image/*',
  [MediaTypeOptions.Images]: 'image/*',
  [MediaTypeOptions.Videos]: 'video/*',
};

export default {
  get name(): string {
    return 'ExponentImagePicker';
  },
  async launchImageLibraryAsync({
    mediaTypes,
    allowsMultipleSelection = false,
  }: ImageLibraryOptions = {}): Promise<ImageResult> {
    return await openFileBrowser({
      mediaTypes: MediaTypeInput[mediaTypes || MediaTypeOptions.All],
      allowsMultipleSelection,
    });
  },
  async launchCameraAsync({
    mediaTypes,
    allowsMultipleSelection = false,
  }: CameraOptions = {}): Promise<ImageResult> {
    return await openFileBrowser({
      mediaTypes: MediaTypeInput[mediaTypes || MediaTypeOptions.All],
      allowsMultipleSelection,
      capture: true,
    });
  },
};

function openFileBrowser({
  mediaTypes,
  capture = false,
  allowsMultipleSelection = false,
}): Promise<ImageResult> {
  const input = document.createElement('input');
  input.style.display = 'none';
  input.setAttribute('type', 'file');
  input.setAttribute('accept', mediaTypes);
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
        reader.onerror = reject;
        reader.onabort = reject;
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
