import { Platform } from '@unimodules/core';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { BareSessionUrlProvider } from './BareSessionUrlProvider';
import { ManagedSessionUrlProvider } from './ManagedSessionUrlProvider';
export function getSessionUrlProvider() {
    if ((Constants.executionEnvironment === ExecutionEnvironment.Standalone ||
        Constants.executionEnvironment === ExecutionEnvironment.StoreClient) &&
        Platform.OS !== 'web') {
        return new ManagedSessionUrlProvider();
    }
    return new BareSessionUrlProvider();
}
//# sourceMappingURL=SessionUrlProvider.js.map