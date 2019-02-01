import { DynamicLink, NativeIOSParameters } from './types';
export default class IOSParameters {
    _appStoreId?: string;
    _bundleId?: string;
    _customScheme?: string;
    _fallbackUrl?: string;
    _iPadBundleId?: string;
    _iPadFallbackUrl?: string;
    _link: DynamicLink;
    _minimumVersion?: string;
    constructor(link: DynamicLink);
    /**
     *
     * @param appStoreId
     * @returns {DynamicLink}
     */
    setAppStoreId(appStoreId: string): DynamicLink;
    /**
     *
     * @param bundleId
     * @returns {DynamicLink}
     */
    setBundleId(bundleId: string): DynamicLink;
    /**
     *
     * @param customScheme
     * @returns {DynamicLink}
     */
    setCustomScheme(customScheme: string): DynamicLink;
    /**
     *
     * @param fallbackUrl
     * @returns {DynamicLink}
     */
    setFallbackUrl(fallbackUrl: string): DynamicLink;
    /**
     *
     * @param iPadBundleId
     * @returns {DynamicLink}
     */
    setIPadBundleId(iPadBundleId: string): DynamicLink;
    /**
     *
     * @param iPadFallbackUrl
     * @returns {DynamicLink}
     */
    setIPadFallbackUrl(iPadFallbackUrl: string): DynamicLink;
    /**
     *
     * @param minimumVersion
     * @returns {DynamicLink}
     */
    setMinimumVersion(minimumVersion: string): DynamicLink;
    build(): NativeIOSParameters;
}
