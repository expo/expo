import { UnavailabilityError, EventEmitter, Platform } from '@unimodules/core';
import ExpoWallet from './ExpoWallet';
import AddPassButton from './AddPassButton';
const WalletEventEmitter = new EventEmitter(ExpoWallet);
export async function canAddPassesAsync() {
    if (!ExpoWallet.canAddPassesAsync) {
        return new Promise(resolve => {
            resolve(false);
        });
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
    switch (Platform.OS) {
        case 'ios':
            return WalletEventEmitter.addListener('Expo.addPassesViewControllerDidFinish', listener);
        case 'web':
            return null;
        default:
            throw new UnavailabilityError('expo-wallet', 'addPassViewDidFinishListener');
    }
}
export { AddPassButton };
//# sourceMappingURL=Wallet.js.map