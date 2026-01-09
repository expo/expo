import NativeModule from './ExpoBrownfieldModule';
class ExpoBrownfieldModule {
    nativeModule;
    constructor(nativeModule) {
        this.nativeModule = nativeModule;
    }
    popToNative(animated = false) {
        this.nativeModule.popToNative(animated);
    }
    sendMessage(message) {
        this.nativeModule.sendMessage(message);
    }
    setNativeBackEnabled(enabled) {
        this.nativeModule.setNativeBackEnabled(enabled);
    }
    addListener(listener) {
        return this.nativeModule.addListener('onMessage', listener);
    }
    listenerCount() {
        return this.nativeModule.listenerCount('onMessage');
    }
    removeAllListeners() {
        return this.nativeModule.removeAllListeners('onMessage');
    }
    removeListener(listener) {
        return this.nativeModule.removeListener('onMessage', listener);
    }
}
export default new ExpoBrownfieldModule(NativeModule);
//# sourceMappingURL=index.js.map