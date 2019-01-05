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
    multiple = false,
  }: ImageLibraryOptions = {}): Promise<ImageResult> {
    const accept = MediaTypeInput[mediaTypes || MediaTypeOptions.All];
    return await openFileBrowser({
      accept,
      multiple,
    });
  },
  async launchCameraAsync({ mediaTypes, multiple = false }: CameraOptions = {}): Promise<
    ImageResult
  > {
    const accept = MediaTypeInput[mediaTypes || MediaTypeOptions.All];
    return await openFileBrowser({
      accept,
      multiple,
      capture: true,
    });
  },
};

function openFileBrowser({ accept, capture = false, multiple = false }): Promise<ImageResult> {
  console.log('openFileBrowser', accept);
  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('accept', accept);
  input.setAttribute('id', 'hidden-file');
  if (multiple) {
    input.setAttribute('multiple', 'multiple');
  }
  if (capture) {
    input.setAttribute('capture', 'camera');
  }

  input.style.display = 'none';

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

    const event = document.createEvent('MouseEvents');
    event.initMouseEvent(
      'click',
      true,
      true,
      window,
      1,
      0,
      0,
      0,
      0,
      false,
      false,
      false,
      false,
      0,
      null
    );
    input.dispatchEvent(event);
  });
}
