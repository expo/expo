import { UnavailabilityError } from '@unimodules/core';
import Sharing from './ExpoSharing';
export async function isAvailableAsync() {
    if (Sharing) {
        if (Sharing.isAvailableAsync) {
            return await Sharing.isAvailableAsync();
        }
        return true;
    }
    return false;
}
export async function shareAsync(url, options = {}) {
    if (!Sharing || !Sharing.shareAsync) {
        throw new UnavailabilityError('Sharing', 'shareAsync');
    }
    return await Sharing.shareAsync(url, options);
}
//# sourceMappingURL=Sharing.js.map