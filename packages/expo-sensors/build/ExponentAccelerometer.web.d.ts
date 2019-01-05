import PlatformModule from './PlatformModule';
declare class ExponentAccelerometer extends PlatformModule {
    readonly name: string;
    isAvailableAsync: () => Promise<boolean>;
    _handleMotion: ({ accelerationIncludingGravity }: {
        accelerationIncludingGravity: any;
    }) => void;
    startObserving: () => void;
    stopObserving: () => void;
}
declare const _default: ExponentAccelerometer;
export default _default;
