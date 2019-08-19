import { UnavailabilityError, EventEmitter, Platform } from '@unimodules/core';
import ExpoWallet from './ExpoWallet';
const WalletEventEmitter = new EventEmitter(ExpoWallet);
export async function canAddPassesAsync() {
    if (!ExpoWallet.canAddPassesAsync) {
        return false;
    }
    return await ExpoWallet.canAddPassesAsync();
}
export async function addPassFromUrlAsync(url) {
    if (!ExpoWallet.addPassFromUrlAsync) {
        throw new UnavailabilityError('expo-wallet', 'addPassFromUrlAsync');
    }
    return await ExpoWallet.addPassFromUrlAsync(url);
}
export function addPassViewDidFinishListener(listener) {
    if (Platform.OS !== 'ios') {
        throw new UnavailabilityError('expo-wallet', 'addPassViewDidFinishListener');
    }
    return WalletEventEmitter.addListener('Expo.addPassesViewControllerDidFinish', listener);
}
//# sourceMappingURL=Wallet.js.map