import { NativeModule, requireNativeModule } from 'expo';

import type {
  ClipboardImage,
  ClipboardEvent,
  GetImageOptions,
  GetStringOptions,
  SetStringAndroidOptions,
  SetStringIOSOptions,
  SetStringOptions,
  SetImageOptions,
} from './Clipboard.types';

export const clipboardEventName = 'onClipboardChanged';

/**
 * `setStringAsync` options as the native module receives them: platform options are flattened,
 * and `expiresAt` is a Unix time in milliseconds.
 */
export type NativeSetStringOptions = Omit<SetStringOptions, 'android' | 'ios'> &
  SetStringAndroidOptions &
  Omit<SetStringIOSOptions, 'expiresAt'> & {
    expiresAt?: number;
  };

type ExpoClipboardEvents = {
  [clipboardEventName]: (event: ClipboardEvent) => void;
};

declare class NativeExpoClipboard extends NativeModule<ExpoClipboardEvents> {
  getStringAsync(options?: GetStringOptions): Promise<string>;
  setStringAsync(text: string, options?: NativeSetStringOptions): Promise<boolean>;
  hasStringAsync(): Promise<boolean>;
  getImageAsync(options: GetImageOptions): Promise<ClipboardImage | null>;
  setImageAsync(base64Image: string, options?: SetImageOptions): Promise<void>;
  hasImageAsync(): Promise<boolean>;
  getUrlAsync?: () => Promise<string | null>;
  setUrlAsync?: (url: string) => Promise<void>;
  hasUrlAsync?: () => Promise<boolean>;

  isPasteButtonAvailable: boolean;
}

export default requireNativeModule<NativeExpoClipboard>('ExpoClipboard');
