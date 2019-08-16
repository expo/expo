import { Subscription } from '@unimodules/core';
import { PassViewFinishListener } from './Wallet.types';
export declare function canAddPassesAsync(): Promise<boolean>;
export declare function addPassFromUrlAsync(url: any): Promise<boolean>;
export declare function addPassFromFilePathAsync(filePath: any): Promise<boolean>;
export declare function addPassViewDidFinishListener(listener: PassViewFinishListener): Subscription;
export { PassViewFinishListener };
