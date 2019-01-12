import PlatformSensorModule from './PlatformSensorModule';
declare class ExponentDeviceMotion extends PlatformSensorModule {
    readonly name: string;
    readonly Gravity: number;
    isAvailableAsync: () => Promise<boolean>;
    _handleMotion: (motion: any) => void;
    startObserving: () => void;
    stopObserving: () => void;
}
declare const _default: ExponentDeviceMotion;
export default _default;
