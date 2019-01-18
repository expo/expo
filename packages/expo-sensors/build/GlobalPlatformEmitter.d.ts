import EventEmitter from 'react-native/Libraries/vendor/emitter/EventEmitter';
declare class GlobalPlatformEmitter extends EventEmitter {
    constructor();
    emit(eventName: string, props: any): void;
}
declare const _default: GlobalPlatformEmitter;
export default _default;
