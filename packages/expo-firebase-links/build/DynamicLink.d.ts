import AnalyticsParameters from './AnalyticsParameters';
import AndroidParameters from './AndroidParameters';
import IOSParameters from './IOSParameters';
import ITunesParameters from './ITunesParameters';
import NavigationParameters from './NavigationParameters';
import SocialParameters from './SocialParameters';
import { NativeDynamicLink } from './types';
export default class DynamicLink {
    _analytics: AnalyticsParameters;
    _android: AndroidParameters;
    _dynamicLinkDomain: string;
    _ios: IOSParameters;
    _itunes: ITunesParameters;
    _link: string;
    _navigation: NavigationParameters;
    _social: SocialParameters;
    constructor(link: string, dynamicLinkDomain: string);
    readonly analytics: AnalyticsParameters;
    readonly android: AndroidParameters;
    readonly ios: IOSParameters;
    readonly itunes: ITunesParameters;
    readonly navigation: NavigationParameters;
    readonly social: SocialParameters;
    build(): NativeDynamicLink;
}
