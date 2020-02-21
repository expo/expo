import Constants from 'expo-constants';
import { BareSessionUrlProvider } from './BareSessionUrlProvider';
import { ManagedSessionUrlProvider } from './ManagedSessionUrlProvider';
export function getSessionUrlProvider() {
    if (Constants.manifest) {
        return new ManagedSessionUrlProvider();
    }
    return new BareSessionUrlProvider();
}
//# sourceMappingURL=SessionUrlProvider.js.map