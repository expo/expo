import { GetStringOptions, SetStringOptions } from './Clipboard.types';
declare const _default: {
    readonly name: string;
    getStringAsync(_options: GetStringOptions): Promise<string>;
    setString(text: string): boolean;
    setStringAsync(text: string, _options: SetStringOptions): Promise<boolean>;
    hasStringAsync(): Promise<boolean>;
    addClipboardListener(): void;
    removeClipboardListener(): void;
};
export default _default;
//# sourceMappingURL=ExpoClipboard.web.d.ts.map