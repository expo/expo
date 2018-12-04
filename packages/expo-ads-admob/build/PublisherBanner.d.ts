import * as React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
declare type AppEvent = {
    [eventName: string]: any;
};
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
     * Test device ID
     */
    testDeviceID?: string;
    /**
     * AdMob iOS library events
     */
    onAdViewDidReceiveAd?: () => void;
    onDidFailToReceiveAdWithError?: (error: string) => void;
    onAdViewWillPresentScreen?: () => void;
    onAdViewWillDismissScreen?: () => void;
    onAdViewDidDismissScreen?: () => void;
    onAdViewWillLeaveApplication?: () => void;
    onAdMobDispatchAppEvent?: (event: AppEvent) => void;
};
declare type StateType = {
    style: {
        width?: number;
        height?: number;
    };
};
export default class PublisherBanner extends React.Component<PropsType, StateType> {
    static propTypes: {
        hitSlop: PropTypes.Validator<import("react-native").Insets | undefined>;
        onLayout: PropTypes.Validator<((event: import("react-native").LayoutChangeEvent) => void) | undefined>;
        pointerEvents: PropTypes.Validator<"box-none" | "none" | "box-only" | "auto" | undefined>;
        removeClippedSubviews: PropTypes.Validator<boolean | undefined>;
        style: PropTypes.Validator<import("react-native").StyleProp<import("react-native").ViewStyle>>;
        testID: PropTypes.Validator<string | undefined>;
        collapsable: PropTypes.Validator<boolean | undefined>;
        needsOffscreenAlphaCompositing: PropTypes.Validator<boolean | undefined>;
        renderToHardwareTextureAndroid: PropTypes.Validator<boolean | undefined>;
        accessibilityViewIsModal: PropTypes.Validator<boolean | undefined>;
        accessibilityActions: PropTypes.Validator<string[] | undefined>;
        onAccessibilityAction: PropTypes.Validator<(() => void) | undefined>;
        shouldRasterizeIOS: PropTypes.Validator<boolean | undefined>;
        onStartShouldSetResponder: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => boolean) | undefined>;
        onMoveShouldSetResponder: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => boolean) | undefined>;
        onResponderEnd: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => void) | undefined>;
        onResponderGrant: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => void) | undefined>;
        onResponderReject: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => void) | undefined>;
        onResponderMove: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => void) | undefined>;
        onResponderRelease: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => void) | undefined>;
        onResponderStart: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => void) | undefined>;
        onResponderTerminationRequest: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => boolean) | undefined>;
        onResponderTerminate: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => void) | undefined>;
        onStartShouldSetResponderCapture: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => boolean) | undefined>;
        onMoveShouldSetResponderCapture: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => boolean) | undefined>;
        onTouchStart: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => void) | undefined>;
        onTouchMove: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => void) | undefined>;
        onTouchEnd: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => void) | undefined>;
        onTouchCancel: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => void) | undefined>;
        onTouchEndCapture: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => void) | undefined>;
        accessible: PropTypes.Validator<boolean | undefined>;
        accessibilityLabel: PropTypes.Validator<string | undefined>;
        accessibilityRole: PropTypes.Validator<"button" | "header" | "link" | "summary" | "image" | "text" | "none" | "search" | "keyboardkey" | "adjustable" | "imagebutton" | undefined>;
        accessibilityStates: PropTypes.Validator<import("react-native").AccessibilityState[] | undefined>;
        accessibilityHint: PropTypes.Validator<string | undefined>;
        accessibilityComponentType: PropTypes.Validator<"button" | "none" | "radiobutton_checked" | "radiobutton_unchecked" | undefined>;
        accessibilityLiveRegion: PropTypes.Validator<"none" | "polite" | "assertive" | undefined>;
        importantForAccessibility: PropTypes.Validator<"auto" | "yes" | "no" | "no-hide-descendants" | undefined>;
        accessibilityElementsHidden: PropTypes.Validator<boolean | undefined>;
        accessibilityTraits: PropTypes.Validator<"button" | "header" | "link" | "summary" | "image" | "text" | "none" | "search" | "adjustable" | "selected" | "disabled" | "plays" | "key" | "frequentUpdates" | "startsMedia" | "allowsDirectInteraction" | "pageTurn" | import("react-native").AccessibilityTrait[] | undefined>;
        onAccessibilityTap: PropTypes.Validator<(() => void) | undefined>;
        onMagicTap: PropTypes.Validator<(() => void) | undefined>;
        accessibilityIgnoresInvertColors: PropTypes.Validator<boolean | undefined>;
        bannerSize: PropTypes.Requireable<string>;
        adUnitID: PropTypes.Requireable<string>;
        testDeviceID: PropTypes.Requireable<string>;
        onAdViewDidReceiveAd: PropTypes.Requireable<(...args: any[]) => any>;
        onDidFailToReceiveAdWithError: PropTypes.Requireable<(...args: any[]) => any>;
        onAdViewWillPresentScreen: PropTypes.Requireable<(...args: any[]) => any>;
        onAdViewWillDismissScreen: PropTypes.Requireable<(...args: any[]) => any>;
        onAdViewDidDismissScreen: PropTypes.Requireable<(...args: any[]) => any>;
        onAdViewWillLeaveApplication: PropTypes.Requireable<(...args: any[]) => any>;
        onAdmobDispatchAppEvent: PropTypes.Requireable<(...args: any[]) => any>;
    };
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
