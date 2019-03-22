declare const _default: {
    readonly name: string;
    isAvailableAsync(): Promise<boolean>;
    _handleMotion({ accelerationIncludingGravity }: {
        accelerationIncludingGravity: any;
    }): void;
    startObserving(): void;
    stopObserving(): void;
};
export default _default;
