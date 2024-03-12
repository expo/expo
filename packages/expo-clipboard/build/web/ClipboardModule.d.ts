import { ClipboardImage, GetImageOptions, GetStringOptions, SetStringOptions } from '../Clipboard.types';
declare const _default: {
    getStringAsync(options: GetStringOptions): Promise<string>;
    setString(text: string): boolean;
    setStringAsync(text: string, options: SetStringOptions): Promise<boolean>;
    hasStringAsync(): Promise<boolean>;
    getImageAsync(_options: GetImageOptions): Promise<ClipboardImage | null>;
    setImageAsync(base64image: string): Promise<void>;
    hasImageAsync(): Promise<boolean>;
    addClipboardListener(): void;
    removeClipboardListener(): void;
};
export default _default;
//# sourceMappingURL=ClipboardModule.d.ts.map