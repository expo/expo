declare const _default: {
    readonly name: string;
    readonly Gravity: number;
    isAvailableAsync(): Promise<boolean>;
    _handleMotion(motion: any): void;
    startObserving(): void;
    stopObserving(): void;
};
export default _default;
