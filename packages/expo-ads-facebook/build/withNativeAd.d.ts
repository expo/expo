import React from 'react';
import { View } from 'react-native';
import { NativeAdIconView } from './AdIconView';
import { NativeAdMediaView } from './AdMediaView';
import AdsManager from './NativeAdsManager';
declare type AdContainerProps<P> = {
    adsManager: AdsManager;
    onAdLoaded?: ((ad: NativeAd) => void) | null;
} & P;
declare type AdProps = {
    nativeAd: NativeAd;
};
/**
 * A higher-order function that wraps the given `Component` type and returns a new container
 * component type that passes in an extra `nativeAd` prop to the wrapped component.
 *
 * The container component renders null if the native ads manager is not yet ready to display ads or
 * if no ad could be loaded.
 */
export default function withNativeAd<P>(Component: React.ComponentType<P & AdProps>): React.ComponentType<AdContainerProps<P>>;
declare type NativeAdViewProps = {
    adsManager: string;
    onAdLoaded?: (event: {
        nativeEvent: NativeAd;
    }) => void;
} & React.ComponentProps<typeof View>;
declare type NativeAdView = React.Component<NativeAdViewProps>;
declare const NativeAdView: React.ComponentType<any>;
export declare type AdIconViewContextValue = {
    nativeRef: (component: NativeAdMediaView | null) => void;
};
export declare type AdMediaViewContextValue = {
    nativeRef: (component: NativeAdIconView | null) => void;
};
export declare type AdTriggerViewContextValue = {
    registerComponent: (component: React.Component) => void;
    unregisterComponent: (component: React.Component) => void;
    onTriggerAd: () => void;
};
export declare type AdChoiceViewContextValue = {
    nativeAdViewRef: React.RefObject<NativeAdView>;
};
export declare const AdIconViewContext: React.Context<AdIconViewContextValue | null>;
export declare const AdMediaViewContext: React.Context<AdMediaViewContextValue | null>;
export declare const AdTriggerViewContext: React.Context<AdTriggerViewContextValue | null>;
export declare const AdChoiceViewContext: React.Context<AdChoiceViewContextValue | null>;
export declare type NativeAd = {
    /**
     * The headline the advertiser entered when they created their ad. This is usually the ad's main
     * title.
     */
    headline?: string;
    /**
     * The link description which is additional information that the advertiser may have entered
     */
    linkDescription?: string;
    /**
     * The name of the Facebook Page or mobile app that represents the business running the ad
     */
    advertiserName?: string;
    /**
     * The ad's social context, such as, "Over half a million users"
     */
    socialContext?: string;
    /**
     * The call-to-action phrase of the ad, such as, "Install Now"
     */
    callToActionText?: string;
    /**
     * The body text, truncated to 90 characters, that contains the text the advertiser entered when
     * they created their ad to tell people what the ad promotes
     */
    bodyText?: string;
    /**
     * The word "ad", translated into the viewer's language
     */
    adTranslation?: string;
    /**
     * The word "promoted", translated into the viewer's language
     */
    promotedTranslation?: string;
    /**
     * The word "sponsored", translated into the viewer's language
     */
    sponsoredTranslation?: string;
};
export {};
