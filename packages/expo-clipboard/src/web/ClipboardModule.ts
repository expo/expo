import {
  ClipboardImage,
  GetImageOptions,
  GetStringOptions,
  SetStringOptions,
  StringFormat,
} from '../Clipboard.types';
import {
  ClipboardUnavailableException,
  CopyFailureException,
  NoPermissionException,
  PasteFailureException,
} from './Exceptions';
import {
  base64toBlob,
  blobToBase64Async,
  findHtmlInClipboardAsync,
  findImageInClipboardAsync,
  getImageSizeFromBlobAsync,
  htmlToPlainText,
  isClipboardPermissionDeniedAsync,
} from './Utils';

export default {
  get name(): string {
    return 'ExpoClipboard';
  },
  async getStringAsync(options: GetStringOptions): Promise<string> {
    if (!navigator.clipboard) {
      throw new ClipboardUnavailableException();
    }

    try {
      switch (options.preferredFormat) {
        case StringFormat.HTML: {
          // Try reading HTML first
          const clipboardItems = await navigator.clipboard.read();
          const blob = await findHtmlInClipboardAsync(clipboardItems);
          if (!blob) {
            // Fall back to plain text
            return await navigator.clipboard.readText();
          }
          return await new Response(blob).text();
        }
        default: {
          let text = await navigator.clipboard.readText();
          if (!text || text === '') {
            // If there's no direct plain text, try reading HTML
            const clipboardItems = await navigator.clipboard.read();
            const blob = await findHtmlInClipboardAsync(clipboardItems);
            const blobText = await blob?.text();
            text = htmlToPlainText(blobText ?? '');
          }
          return text;
        }
      }
    } catch (e) {
      // it might fail, because user denied permission
      if (e.name === 'NotAllowedError' || (await isClipboardPermissionDeniedAsync())) {
        throw new NoPermissionException();
      }

      try {
        // Internet Explorer
        // @ts-ignore
        return window.clipboardData.getData('Text');
      } catch {
        return Promise.reject(new Error('Unable to retrieve item from clipboard'));
      }
    }
  },
  // TODO: (barthap) The `setString` was deprecated in SDK 45. Remove this function in a few SDK cycles.
  setString(text: string): boolean {
    const textField = document.createElement('textarea');
    textField.textContent = text;
    document.body.appendChild(textField);
    textField.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textField);
    }
  },
  async setStringAsync(text: string, options: SetStringOptions): Promise<boolean> {
    switch (options.inputFormat) {
      case StringFormat.HTML: {
        if (!navigator.clipboard) {
          throw new ClipboardUnavailableException();
        }

        try {
          const clipboardItemInput = createHtmlClipboardItem(text);
          await navigator.clipboard.write([clipboardItemInput]);
          return true;
        } catch (e) {
          // it might fail, because user denied permission
          if (e.name === 'NotAllowedError' || (await isClipboardPermissionDeniedAsync())) {
            throw new NoPermissionException();
          }
          throw new CopyFailureException(e.message);
        }
      }
      default: {
        try {
          if (!navigator.clipboard) {
            throw new Error();
          }
          await navigator.clipboard.writeText(text);
          return true;
        } catch {
          // we can fall back to legacy behavior in any kind of failure
          // including navigator.clipboard unavailability
          return this.setString(text);
        }
      }
    }
  },
  async hasStringAsync(): Promise<boolean> {
    return await clipboardHasTypesAsync(['text/plain', 'text/html']);
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

      const [data, size] = await Promise.all([
        blobToBase64Async(blob),
        getImageSizeFromBlobAsync(blob),
      ]);

      return { data, size };
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
        // I cannot use `@ts-expect-error` here because some environments consider this correct:
        // expo-module build - OK,
        // et gdad - error
        // Fixed in TS >4.4.3: https://github.com/microsoft/TypeScript/issues/46116#issuecomment-932443415
        // @ts-ignore Some tools seem to use TS <= 4.4.3
        new ClipboardItem({
          [blob.type]: blob,
        } as Record<string, ClipboardItemDataType>),
      ]);
    } catch (err: any) {
      throw new CopyFailureException(err.message);
    }
  },
  async hasImageAsync(): Promise<boolean> {
    return await clipboardHasTypesAsync(['image/png', 'image/jpeg']);
  },
  addClipboardListener(): void {},
  removeClipboardListener(): void {},
};

/**
 * Resolves to true if clipboard has one of provided {@link types}.
 * @throws `ClipboardUnavailableException` if AsyncClipboard API is not available
 * @throws `NoPermissionException` if user denied permission
 */
async function clipboardHasTypesAsync(types: string[]): Promise<boolean> {
  if (!navigator.clipboard) {
    throw new ClipboardUnavailableException();
  }

  try {
    const clipboardItems = await navigator.clipboard.read();
    return clipboardItems.flatMap((item) => item.types).some((type) => types.includes(type));
  } catch (e) {
    // it might fail, because user denied permission
    if (e.name === 'NotAllowedError' || (await isClipboardPermissionDeniedAsync())) {
      throw new NoPermissionException();
    }
    throw e;
  }
}

function createHtmlClipboardItem(htmlString: string): ClipboardItem {
  return new ClipboardItem({
    // @ts-ignore `Blob` from `lib.dom.d.ts` and the one from `@types/react-native` differ
    'text/html': new Blob([htmlString], { type: 'text/html' }),
    // @ts-ignore `Blob` from `lib.dom.d.ts` and the one from `@types/react-native` differ
    'text/plain': new Blob([htmlToPlainText(htmlString)], { type: 'text/plain' }),
  });
}
