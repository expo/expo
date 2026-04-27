import { requireNativeModule } from 'expo';
import { getInitialRouteName, initRouterNavigationEvents } from './routerIntegration';
const NativeModule = requireNativeModule('ExpoAppMetrics');
initRouterNavigationEvents();
export default {
    ...NativeModule,
    markInteractive(attributes) {
        // If the markInteractive is called before the first render, we mark both events.
        // Otherwise the markFirstRender would not mark native event.
        // This can happen in two scenarios:
        // 1. User calls markInteractive manually before the first render.
        // 2. User calls markInteractive in child's useEffect, while the first render is marked in parent's useEffect.
        NativeModule.markFirstRender();
        NativeModule.markInteractive({ routeName: getInitialRouteName(), ...attributes });
    },
};
//# sourceMappingURL=module.js.map