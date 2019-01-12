import PlatformSensorModule from './PlatformSensorModule';
declare class ExponentGyroscope extends PlatformSensorModule {
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
