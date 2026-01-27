import { NativeModule } from 'expo-modules-core';
import { ClipboardImage, ClipboardEvent, GetImageOptions, GetStringOptions, SetStringOptions } from './Clipboard.types';
export declare const clipboardEventName = "onClipboardChanged";
type ExpoClipboardEvents = {
    [clipboardEventName]: (event: ClipboardEvent) => void;
};
declare class NativeExpoClipboard extends NativeModule<ExpoClipboardEvents> {
    setString(text: string): void;
    getStringAsync(options?: GetStringOptions): Promise<string>;
    setStringAsync(text: string, options?: SetStringOptions): Promise<boolean>;
    hasStringAsync(): Promise<boolean>;
    getImageAsync(options: GetImageOptions): Promise<ClipboardImage | null>;
    setImageAsync(base64Image: string): Promise<void>;
    hasImageAsync(): Promise<boolean>;
    getUrlAsync?: () => Promise<string | null>;
    setUrlAsync?: (url: string) => Promise<void>;
    hasUrlAsync?: () => Promise<boolean>;
    isPasteButtonAvailable: boolean;
}
declare const _default: NativeExpoClipboard;
export default _default;
//# sourceMappingURL=ExpoClipboard.d.ts.map