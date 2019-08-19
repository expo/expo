import { Subscription } from '@unimodules/core';
import { PassViewFinishListener } from './Wallet.types';
import AddPassButton from './AddPassButton';
export declare function canAddPassesAsync(): Promise<boolean>;
export declare function addPassFromUrlAsync(url: string): Promise<boolean>;
export declare function addPassViewDidFinishListener(listener: PassViewFinishListener): Subscription | null;
export { PassViewFinishListener, AddPassButton };
