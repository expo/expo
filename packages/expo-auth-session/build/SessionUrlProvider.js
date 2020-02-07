import Constants from 'expo-constants';
import { ManagedSessionUrlProvider } from './ManagedSessionUrlProvider';
import { BareSessionUrlProvider } from './BareSessionUrlProvider';
export function getSessionUrlProvider() {
    if (Constants.manifest) {
        return new ManagedSessionUrlProvider();
    }
    return new BareSessionUrlProvider();
}
//# sourceMappingURL=SessionUrlProvider.js.map