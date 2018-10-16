/**
 * @flow
 * IOSParameters representation wrapper
 */
import type DynamicLink from './DynamicLink';
import type { NativeIOSParameters } from './types';

export default class IOSParameters {
  _appStoreId: string | void;

  _bundleId: string | void;

  _customScheme: string | void;

  _fallbackUrl: string | void;

  _iPadBundleId: string | void;

  _iPadFallbackUrl: string | void;

  _link: DynamicLink;

  _minimumVersion: string | void;

  constructor(link: DynamicLink) {
    this._link = link;
  }

  /**
   *
   * @param appStoreId
   * @returns {DynamicLink}
   */
  setAppStoreId(appStoreId: string): DynamicLink {
    this._appStoreId = appStoreId;
    return this._link;
  }

  /**
   *
   * @param bundleId
   * @returns {DynamicLink}
   */
  setBundleId(bundleId: string): DynamicLink {
    this._bundleId = bundleId;
    return this._link;
  }

  /**
   *
   * @param customScheme
   * @returns {DynamicLink}
   */
  setCustomScheme(customScheme: string): DynamicLink {
    this._customScheme = customScheme;
    return this._link;
  }

  /**
   *
   * @param fallbackUrl
   * @returns {DynamicLink}
   */
  setFallbackUrl(fallbackUrl: string): DynamicLink {
    this._fallbackUrl = fallbackUrl;
    return this._link;
  }

  /**
   *
   * @param iPadBundleId
   * @returns {DynamicLink}
   */
  setIPadBundleId(iPadBundleId: string): DynamicLink {
    this._iPadBundleId = iPadBundleId;
    return this._link;
  }

  /**
   *
   * @param iPadFallbackUrl
   * @returns {DynamicLink}
   */
  setIPadFallbackUrl(iPadFallbackUrl: string): DynamicLink {
    this._iPadFallbackUrl = iPadFallbackUrl;
    return this._link;
  }

  /**
   *
   * @param minimumVersion
   * @returns {DynamicLink}
   */
  setMinimumVersion(minimumVersion: string): DynamicLink {
    this._minimumVersion = minimumVersion;
    return this._link;
  }

  build(): NativeIOSParameters {
    if (
      (this._appStoreId ||
        this._customScheme ||
        this._fallbackUrl ||
        this._iPadBundleId ||
        this._iPadFallbackUrl ||
        this._minimumVersion) &&
      !this._bundleId
    ) {
      throw new Error('IOSParameters: Missing required `bundleId` property');
    }
    return {
      appStoreId: this._appStoreId,
      bundleId: this._bundleId,
      customScheme: this._customScheme,
      fallbackUrl: this._fallbackUrl,
      iPadBundleId: this._iPadBundleId,
      iPadFallbackUrl: this._iPadFallbackUrl,
      minimumVersion: this._minimumVersion,
    };
  }
}
