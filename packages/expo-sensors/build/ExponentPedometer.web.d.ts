import PlatformModule from './PlatformModule';
declare class ExponentPedometer extends PlatformModule {
    readonly name: string;
    isAvailableAsync(): Promise<Boolean>;
}
declare const _default: ExponentPedometer;
export default _default;
