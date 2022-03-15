import {
  ClipboardImage,
  GetImageOptions,
  GetStringOptions,
  SetStringOptions,
} from '../Clipboard.types';
import {
  ClipboardUnavailableException,
  CopyFailureException,
  NoPermissionException,
  PasteFailureException,
} from './WebExceptions';
import {
  base64toBlob,
  blobToBase64Async,
  findImageInClipboardAsync,
  getImageSizeFromBlobAsync,
  isClipboardPermissionDeniedAsync,
} from './WebUtils';

export default {
  get name(): string {
    return 'ExpoClipboard';
  },
  async getStringAsync(_options: GetStringOptions): Promise<string> {
    let text = '';
    try {
      text = await navigator.clipboard.readText();
    } catch (e) {
      // it might fail, because user denied permission
      if (e.name === 'NotAllowedError' || (await isClipboardPermissionDeniedAsync())) {
        throw new NoPermissionException();
      }

      try {
        // Internet Explorer
        // @ts-ignore
        text = window.clipboardData.getData('Text');
      } catch (e) {
        return Promise.reject(new Error('Unable to retrieve item from clipboard.'));
      }
    }
    return text;
  },
  setString(text: string): boolean {
    let success = false;
    const textField = document.createElement('textarea');
    textField.textContent = text;
    document.body.appendChild(textField);
    textField.select();
    try {
      document.execCommand('copy');
      success = true;
    } catch (e) {}
    document.body.removeChild(textField);
    return success;
  },
  async setStringAsync(text: string, _options: SetStringOptions): Promise<boolean> {
    return this.setString(text);
  },
  async hasStringAsync(): Promise<boolean> {
    return this.getStringAsync({}).then((text) => text.length > 0);
  },
  async getImageAsync(_options: GetImageOptions): Promise<ClipboardImage | null> {
    if (!navigator.clipboard) {
      throw new ClipboardUnavailableException();
    }

    try {
      const clipboardItems = await navigator.clipboard.read();
      const blob = await findImageInClipboardAsync(clipboardItems);
      if (!blob) {
        return null;
      }

      const [data, [width, height]] = await Promise.all([
        blobToBase64Async(blob),
        getImageSizeFromBlobAsync(blob),
      ]);

      return {
        data,
        size: { width, height },
      };
    } catch (e) {
      // it might fail, because user denied permission
      if (e.name === 'NotAllowedError' || (await isClipboardPermissionDeniedAsync())) {
        throw new NoPermissionException();
      }
      throw new PasteFailureException(e.message);
    }
  },
  async setImageAsync(base64image: string): Promise<void> {
    if (!navigator.clipboard) {
      throw new ClipboardUnavailableException();
    }

    try {
      // we set it always to `image/png` because it's the only format supported by the clipboard
      // but it seems to work even when provided jpeg data
      const blob = base64toBlob(base64image, 'image/png');
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
    } catch (err: any) {
      throw new CopyFailureException(err.message);
    }
  },
  async hasImageAsync(): Promise<boolean> {
    if (!navigator.clipboard) {
      throw new ClipboardUnavailableException();
    }

    try {
      const clipboardItems = await navigator.clipboard.read();
      return clipboardItems
        .flatMap((item) => item.types)
        .some((type) => type === 'image/png' || type === 'image/jpeg');
    } catch (e) {
      // it might fail, because user denied permission
      if (e.name === 'NotAllowedError' || (await isClipboardPermissionDeniedAsync())) {
        throw new NoPermissionException();
      }
      throw e;
    }
  },
  addClipboardListener(): void {},
  removeClipboardListener(): void {},
};
