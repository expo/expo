import { CodedError } from 'expo-modules-core';

import { ClipboardImage, GetImageOptions } from './Clipboard.types';

class ClipboardUnavailableException extends CodedError {
  constructor() {
    super(
      'ERR_CLIPBOARD_UNAVAILABLE',
      "The 'AsyncClipboard' API is not available on this browser."
    );
  }
}

class CopyFailureException extends CodedError {
  constructor(cause: string) {
    super('ERR_COPY_FAILURE', `Failed to copy to clipboard: ${cause}`);
  }
}

class PasteFailureException extends CodedError {
  constructor(cause: string) {
    super('ERR_COPY_FAILURE', `Failed to paste from clipboard: ${cause}`);
  }
}

class NoPermissionException extends CodedError {
  constructor() {
    super('ERR_NO_PERMISSION', 'User denied permission to access clipboard');
  }
}

/**
 * Converts base64-encoded data to a `Blob` object.
 * @see https://stackoverflow.com/a/20151856
 */
function base64toBlob(base64Data: string, contentType: string): Blob {
  contentType = contentType || '';
  const sliceSize = 1024;
  const byteCharacters = atob(base64Data);
  const bytesLength = byteCharacters.length;
  const slicesCount = Math.ceil(bytesLength / sliceSize);
  const byteArrays = new Array(slicesCount);

  for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
    const begin = sliceIndex * sliceSize;
    const end = Math.min(begin + sliceSize, bytesLength);

    const bytes = new Array(end - begin);
    for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
      bytes[i] = byteCharacters[offset].charCodeAt(0);
    }
    byteArrays[sliceIndex] = new Uint8Array(bytes);
  }
  return new Blob(byteArrays, { type: contentType });
}

/**
 * Converts blob to base64-encoded string with Data-URL prefix.
 */
function blobToBase64Async(blob: Blob): Promise<string> {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

function getImageSizeFromBlobAsync(blob: Blob): Promise<[width: number, height: number]> {
  return new Promise((resolve, _) => {
    const blobUrl = URL.createObjectURL(blob);
    const img = document.createElement('img');
    img.src = blobUrl;
    img.onload = function () {
      resolve([img.width, img.height]);
    };
  });
}

async function findImageInClipboardAsync(items: ClipboardItems): Promise<Blob | null> {
  for (const clipboardItem of items) {
    // first look for png
    if (clipboardItem.types.some((type) => type === 'image/png')) {
      return await clipboardItem.getType('image/png');
    }

    // alternatively, an image might be a jpeg
    // NOTE: Currently, this is not supported by browsers yet. They only support PNG now
    if (clipboardItem.types.some((type) => type === 'image/jpeg')) {
      return await clipboardItem.getType('image/jpeg');
    }
  }
  return null;
}

async function isClipboardPermissionDeniedAsync(): Promise<boolean> {
  const queryOpts = { name: 'clipboard-read' as PermissionName };
  const permissionStatus = await navigator.permissions.query(queryOpts);
  return permissionStatus.state === 'denied';
}

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
      } catch {
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
    } catch {}
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
