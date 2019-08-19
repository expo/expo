import { Subscription } from '@unimodules/core';
import { PassViewFinishListener } from './Wallet.types';
import ExpoWalletAddPassButton from './ExpoWalletAddPassButton';
export declare function canAddPassesAsync(): Promise<boolean>;
export declare function addPassFromUrlAsync(url: any): Promise<boolean>;
export declare function addPassViewDidFinishListener(listener: PassViewFinishListener): Subscription;
export { PassViewFinishListener, ExpoWalletAddPassButton as AddPassButton };
