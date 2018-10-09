/**
 * @flow
 * AndroidParameters representation wrapper
 */
import type DynamicLink from './DynamicLink';
import type { NativeAndroidParameters } from './types';

export default class AndroidParameters {
  _fallbackUrl: string | void;

  _link: DynamicLink;

  _minimumVersion: number | void;

  _packageName: string | void;

  constructor(link: DynamicLink) {
    this._link = link;
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
   * @param minimumVersion
   * @returns {DynamicLink}
   */
  setMinimumVersion(minimumVersion: number): DynamicLink {
    this._minimumVersion = minimumVersion;
    return this._link;
  }

  /**
   *
   * @param packageName
   * @returns {DynamicLink}
   */
  setPackageName(packageName: string): DynamicLink {
    this._packageName = packageName;
    return this._link;
  }

  build(): NativeAndroidParameters {
    if ((this._fallbackUrl || this._minimumVersion) && !this._packageName) {
      throw new Error(
        'AndroidParameters: Missing required `packageName` property'
      );
    }
    return {
      fallbackUrl: this._fallbackUrl,
      minimumVersion: this._minimumVersion,
      packageName: this._packageName,
    };
  }
}
