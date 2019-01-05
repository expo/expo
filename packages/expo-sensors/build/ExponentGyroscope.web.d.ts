import PlatformModule from './PlatformModule';
declare class ExponentGyroscope extends PlatformModule {
    readonly name: string;
    isAvailableAsync: () => Promise<boolean>;
    _handleMotion: ({ alpha: z, beta: y, gamma: x }: {
        alpha: any;
        beta: any;
        gamma: any;
    }) => void;
    startObserving: () => void;
    stopObserving: () => void;
}
declare const _default: ExponentGyroscope;
export default _default;
