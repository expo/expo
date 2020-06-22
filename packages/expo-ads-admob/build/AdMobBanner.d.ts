import * as React from 'react';
import { View } from 'react-native';
declare type PropsType = React.ComponentProps<typeof View> & {
    /**
     * AdMob iOS library banner size constants
     * (https://developers.google.com/admob/ios/banner)
     * banner (320x50, Standard Banner for Phones and Tablets)
     * largeBanner (320x100, Large Banner for Phones and Tablets)
     * mediumRectangle (300x250, IAB Medium Rectangle for Phones and Tablets)
     * fullBanner (468x60, IAB Full-Size Banner for Tablets)
     * leaderboard (728x90, IAB Leaderboard for Tablets)
     * smartBannerPortrait (Screen width x 32|50|90, Smart Banner for Phones and Tablets)
     * smartBannerLandscape (Screen width x 32|50|90, Smart Banner for Phones and Tablets)
     *
     * banner is default
     */
    bannerSize: 'banner' | 'largeBanner' | 'mediumRectangle' | 'fullBanner' | 'leaderboard' | 'smartBannerPortrait' | 'smartBannerLandscape';
    /**
     * AdMob ad unit ID
     */
    adUnitID?: string;
    /**
     * Additional request params added to underlying request for the ad.
     */
    additionalRequestParams?: {
        [key: string]: string;
    };
    /**
     * Whether the SDK should serve personalized ads (use only with user's consent). If this value is
     * `false` or `undefined`, this sets the `npa` key of `additionalRequestParams` to `'1'` following
     * https://developers.google.com/admob/ios/eu-consent#forward_consent_to_the_google_mobile_ads_sdk
     * and
     * https://developers.google.com/admob/android/eu-consent#forward_consent_to_the_google_mobile_ads_sdk.
     */
    servePersonalizedAds?: boolean;
    /**
     * AdMob iOS library events
     */
    onAdViewDidReceiveAd?: () => void;
    onDidFailToReceiveAdWithError?: (string: any) => void;
    onAdViewWillPresentScreen?: () => void;
    onAdViewWillDismissScreen?: () => void;
    onAdViewDidDismissScreen?: () => void;
    onAdViewWillLeaveApplication?: () => void;
};
declare type StateType = {
    style: {
        width?: number;
        height?: number;
    };
};
export default class AdMobBanner extends React.Component<PropsType, StateType> {
    static defaultProps: {
        bannerSize: string;
    };
    state: {
        style: {};
    };
    _handleSizeChange: ({ nativeEvent }: {
        nativeEvent: {
            width: number;
            height: number;
        };
    }) => void;
    _handleDidFailToReceiveAdWithError: ({ nativeEvent }: {
        nativeEvent: {
            error: string;
        };
    }) => void | undefined;
    render(): JSX.Element;
}
export {};
