import { requireNativeModule } from 'expo';
import { initRouterIntegration } from './integrations/expo-router/init';
import { isRouterInstalled } from './integrations/expo-router/router';
const native = requireNativeModule('ExpoObserve');
const ExpoObserve = new Proxy(native, {
    get(target, prop, receiver) {
        if (prop === 'configure') {
            return (config) => {
                const { disableRouterIntegration, ...nativeConfig } = config;
                if (!disableRouterIntegration && isRouterInstalled) {
                    initRouterIntegration();
                }
                return target.configure(nativeConfig);
            };
        }
        return Reflect.get(target, prop, receiver);
    },
});
export default ExpoObserve;
//# sourceMappingURL=module.js.map