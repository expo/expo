import { DynamicLink, NativeAndroidParameters } from './types';
export default class AndroidParameters {
    _fallbackUrl?: string;
    _link: DynamicLink;
    _minimumVersion?: number;
    _packageName?: string;
    constructor(link: DynamicLink);
    /**
     *
     * @param fallbackUrl
     * @returns {DynamicLink}
     */
    setFallbackUrl(fallbackUrl: string): DynamicLink;
    /**
     *
     * @param minimumVersion
     * @returns {DynamicLink}
     */
    setMinimumVersion(minimumVersion: number): DynamicLink;
    /**
     *
     * @param packageName
     * @returns {DynamicLink}
     */
    setPackageName(packageName: string): DynamicLink;
    build(): NativeAndroidParameters;
}
