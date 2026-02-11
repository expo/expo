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
 * Returns raw data shared with the app. Returns an empty array if no data has been shared with the app.
 *
 * @platform android
 * @platform ios
 * @experimental
 */
export declare function getSharedPayloads(): SharePayload[];
/**
 * Returns resolved data shared with the app. Compared to data returned from [`getSharedPayloads`](#sharinggetsharedpayloads) contains additional
 * information useful for reading and displaying the data. For example, when a web `URL` is shared with the app,
 * a resolved payload will contain additional information about the URL contents.
 *
 * > Depending on what has been shared, this method may require a network connection to resolve content details.
 *
 * @platform android
 * @platform ios
 * @experimental
 */
export declare function getResolvedSharedPayloadsAsync(): Promise<ResolvedSharePayload[]>;
/**
 * Clears the data shared with the app.
 */
export declare function clearSharedPayloads(): void;
//# sourceMappingURL=Sharing.d.ts.map