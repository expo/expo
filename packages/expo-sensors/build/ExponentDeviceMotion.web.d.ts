import PlatformModule from './PlatformModule';
declare class ExponentDeviceMotion extends PlatformModule {
    readonly name: string;
    readonly Gravity: number;
    isAvailableAsync: () => Promise<boolean>;
    _handleMotion: ({ acceleration, accelerationIncludingGravity, rotationRate }: {
        acceleration: any;
        accelerationIncludingGravity: any;
        rotationRate: any;
    }) => void;
    startObserving: () => void;
    stopObserving: () => void;
}
declare const _default: ExponentDeviceMotion;
export default _default;
