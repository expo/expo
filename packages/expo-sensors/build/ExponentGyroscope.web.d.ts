declare const _default: {
    readonly name: string;
    isAvailableAsync(): Promise<boolean>;
    _handleMotion({ alpha: z, beta: y, gamma: x }: {
        alpha: any;
        beta: any;
        gamma: any;
    }): void;
    startObserving(): void;
    stopObserving(): void;
};
export default _default;
