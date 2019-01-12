import PlatformSensorModule from './PlatformSensorModule';
declare class ExponentAccelerometer extends PlatformSensorModule {
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
