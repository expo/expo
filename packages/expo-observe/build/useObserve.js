import AppMetrics from 'expo-app-metrics';
import { useObserveForRouter } from './integrations/expo-router';
export function useObserve() {
    const routerMarkInteractive = useObserveForRouter();
    return {
        markInteractive: routerMarkInteractive ?? AppMetrics.markInteractive,
    };
}
//# sourceMappingURL=useObserve.js.map