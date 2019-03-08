/**
 * This emitter is used for sending synthetic native events to listeners
 * registered in the API layer with `NativeEventEmitter`.
 */
declare class SyntheticPlatformEmitter {
    _emitter: any;
    emit(eventName: string, props: any): void;
}
declare const _default: SyntheticPlatformEmitter;
export default _default;
