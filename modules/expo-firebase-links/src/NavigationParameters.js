/**
 * @flow
 * NavigationParameters representation wrapper
 */
import type DynamicLink from './DynamicLink';
import type { NativeNavigationParameters } from './types';

export default class NavigationParameters {
  _forcedRedirectEnabled: boolean | void;

  _link: DynamicLink;

  constructor(link: DynamicLink) {
    this._link = link;
  }

  /**
   *
   * @param forcedRedirectEnabled
   * @returns {DynamicLink}
   */
  setForcedRedirectEnabled(forcedRedirectEnabled: boolean): DynamicLink {
    this._forcedRedirectEnabled = forcedRedirectEnabled;
    return this._link;
  }

  build(): NativeNavigationParameters {
    return {
      forcedRedirectEnabled: this._forcedRedirectEnabled,
    };
  }
}
