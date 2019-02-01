import { DynamicLink, NativeNavigationParameters } from './types';
export default class NavigationParameters {
    _forcedRedirectEnabled?: boolean;
    _link: DynamicLink;
    constructor(link: DynamicLink);
    /**
     *
     * @param forcedRedirectEnabled
     * @returns {DynamicLink}
     */
    setForcedRedirectEnabled(forcedRedirectEnabled: boolean): DynamicLink;
    build(): NativeNavigationParameters;
}
