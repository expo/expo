declare const _default: {
    readonly name: string;
    getStringAsync(): Promise<string>;
    setString(text: string): boolean;
    addClipboardListener(): void;
    removeClipboardListener(): void;
};
export default _default;
