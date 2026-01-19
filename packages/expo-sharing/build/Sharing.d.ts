import { ResolvedSharePayload, SharePayload, SharingOptions } from './Sharing.types';
/**
 * Determine if the sharing API can be used in this app.
 * @return A promise that fulfills with `true` if the sharing API can be used, and `false` otherwise.
 */
export declare function isAvailableAsync(): Promise<boolean>;
/**
 * Opens action sheet to share file to different applications which can handle this type of file.
 * @param url Local file URL to share.
 * @param options A map of share options.
 */
export declare function shareAsync(url: string, options?: SharingOptions): Promise<void>;
/**
 * TODO: Docs
 */
export declare function getSharedPayloads(): SharePayload[];
/**
 * TODO: Docs
 */
export declare function getResolvedSharedPayloadsAsync(): Promise<ResolvedSharePayload[]>;
/**
 * Clears the data shared with the app.
 */
export declare function clearSharedPayloads(): void;
//# sourceMappingURL=Sharing.d.ts.map