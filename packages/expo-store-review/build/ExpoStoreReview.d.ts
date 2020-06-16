declare const _default: {
    readonly name: string;
    isAvailableAsync(): Promise<boolean>;
    requestReview: (() => Promise<void>) | null;
};
export default _default;
