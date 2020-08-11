declare const _default: {
    readonly name: string;
    isAvailableAsync(): Promise<false>;
    preventScreenCaptureAsync(tag?: string): Promise<null>;
    allowScreenCaptureAsync(tag?: string): Promise<null>;
    usePreventScreenCapture(tag?: string): Promise<null>;
};
export default _default;
