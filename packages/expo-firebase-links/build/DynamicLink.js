import invariant from 'invariant';
import AnalyticsParameters from './AnalyticsParameters';
import AndroidParameters from './AndroidParameters';
import IOSParameters from './IOSParameters';
import ITunesParameters from './ITunesParameters';
import NavigationParameters from './NavigationParameters';
import SocialParameters from './SocialParameters';
export default class DynamicLink {
    constructor(link, dynamicLinkDomain) {
        this._analytics = new AnalyticsParameters(this);
        this._android = new AndroidParameters(this);
        this._dynamicLinkDomain = dynamicLinkDomain;
        this._ios = new IOSParameters(this);
        this._itunes = new ITunesParameters(this);
        this._link = link;
        this._navigation = new NavigationParameters(this);
        this._social = new SocialParameters(this);
    }
    get analytics() {
        return this._analytics;
    }
    get android() {
        return this._android;
    }
    get ios() {
        return this._ios;
    }
    get itunes() {
        return this._itunes;
    }
    get navigation() {
        return this._navigation;
    }
    get social() {
        return this._social;
    }
    build() {
        invariant(this._link, 'DynamicLink: Missing required `link` property');
        invariant(this._dynamicLinkDomain, 'DynamicLink: Missing required `dynamicLinkDomain` property');
        return {
            analytics: this._analytics.build(),
            android: this._android.build(),
            dynamicLinkDomain: this._dynamicLinkDomain,
            ios: this._ios.build(),
            itunes: this._itunes.build(),
            link: this._link,
            navigation: this._navigation.build(),
            social: this._social.build(),
        };
    }
}
//# sourceMappingURL=DynamicLink.js.map