import { NativeModule, registerWebModule } from 'expo';
export * from './types';
class ExpoObserveModule extends NativeModule {
    async dispatchEvents() { }
    configure(config) { }
    setBundleDefaults(defaults) { }
}
export default registerWebModule(ExpoObserveModule, 'ExpoObserve');
//# sourceMappingURL=module.web.js.map