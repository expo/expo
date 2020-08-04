declare const _default: {
    readonly name: string;
    /**
     * Gravity on the planet this module supports (currently just Earth) represented as m/s^2.
     */
    readonly Gravity: number;
    isAvailableAsync(): Promise<boolean>;
    _handleMotion(motion: any): void;
    startObserving(): void;
    stopObserving(): void;
};
export default _default;
