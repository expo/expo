import PropTypes from 'prop-types';
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
     * Test device ID
     */
    testDeviceID?: string;
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
    static propTypes: {
        hitSlop?: PropTypes.Validator<import("react-native").Insets | undefined> | undefined;
        onLayout?: PropTypes.Validator<((event: import("react-native").LayoutChangeEvent) => void) | undefined> | undefined;
        pointerEvents?: PropTypes.Validator<"box-none" | "none" | "box-only" | "auto" | undefined> | undefined;
        removeClippedSubviews?: PropTypes.Validator<boolean | undefined> | undefined;
        style?: PropTypes.Validator<import("react-native").StyleProp<import("react-native").ViewStyle>> | undefined;
        testID?: PropTypes.Validator<string | undefined> | undefined;
        nativeID?: PropTypes.Validator<string | undefined> | undefined;
        collapsable?: PropTypes.Validator<boolean | undefined> | undefined;
        needsOffscreenAlphaCompositing?: PropTypes.Validator<boolean | undefined> | undefined;
        renderToHardwareTextureAndroid?: PropTypes.Validator<boolean | undefined> | undefined;
        accessibilityViewIsModal?: PropTypes.Validator<boolean | undefined> | undefined;
        accessibilityActions?: PropTypes.Validator<string[] | undefined> | undefined;
        onAccessibilityAction?: PropTypes.Validator<(() => void) | undefined> | undefined;
        shouldRasterizeIOS?: PropTypes.Validator<boolean | undefined> | undefined;
        onStartShouldSetResponder?: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => boolean) | undefined> | undefined;
        onMoveShouldSetResponder?: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => boolean) | undefined> | undefined;
        onResponderEnd?: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => void) | undefined> | undefined;
        onResponderGrant?: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => void) | undefined> | undefined;
        onResponderReject?: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => void) | undefined> | undefined;
        onResponderMove?: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => void) | undefined> | undefined;
        onResponderRelease?: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => void) | undefined> | undefined;
        onResponderStart?: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => void) | undefined> | undefined;
        onResponderTerminationRequest?: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => boolean) | undefined> | undefined;
        onResponderTerminate?: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => void) | undefined> | undefined;
        onStartShouldSetResponderCapture?: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => boolean) | undefined> | undefined;
        onMoveShouldSetResponderCapture?: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => boolean) | undefined> | undefined;
        onTouchStart?: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => void) | undefined> | undefined;
        onTouchMove?: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => void) | undefined> | undefined;
        onTouchEnd?: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => void) | undefined> | undefined;
        onTouchCancel?: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => void) | undefined> | undefined;
        onTouchEndCapture?: PropTypes.Validator<((event: import("react-native").GestureResponderEvent) => void) | undefined> | undefined;
        accessible?: PropTypes.Validator<boolean | undefined> | undefined;
        accessibilityLabel?: PropTypes.Validator<string | undefined> | undefined;
        accessibilityRole?: PropTypes.Validator<"button" | "header" | "link" | "summary" | "image" | "text" | "none" | "search" | "keyboardkey" | "adjustable" | "imagebutton" | undefined> | undefined;
        accessibilityStates?: PropTypes.Validator<import("react-native").AccessibilityState[] | undefined> | undefined;
        accessibilityHint?: PropTypes.Validator<string | undefined> | undefined;
        accessibilityComponentType?: PropTypes.Validator<"button" | "none" | "radiobutton_checked" | "radiobutton_unchecked" | undefined> | undefined;
        accessibilityLiveRegion?: PropTypes.Validator<"none" | "polite" | "assertive" | undefined> | undefined;
        importantForAccessibility?: PropTypes.Validator<"auto" | "yes" | "no" | "no-hide-descendants" | undefined> | undefined;
        accessibilityElementsHidden?: PropTypes.Validator<boolean | undefined> | undefined;
        accessibilityTraits?: PropTypes.Validator<"button" | "header" | "link" | "summary" | "image" | "text" | "none" | "search" | "adjustable" | "selected" | "disabled" | "plays" | "key" | "frequentUpdates" | "startsMedia" | "allowsDirectInteraction" | "pageTurn" | import("react-native").AccessibilityTrait[] | undefined> | undefined;
        onAccessibilityTap?: PropTypes.Validator<(() => void) | undefined> | undefined;
        onMagicTap?: PropTypes.Validator<(() => void) | undefined> | undefined;
        accessibilityIgnoresInvertColors?: PropTypes.Validator<boolean | undefined> | undefined;
        bannerSize: PropTypes.Requireable<string>;
        adUnitID: PropTypes.Requireable<string>;
        testDeviceID: PropTypes.Requireable<string>;
        onAdViewDidReceiveAd: PropTypes.Requireable<(...args: any[]) => any>;
        onDidFailToReceiveAdWithError: PropTypes.Requireable<(...args: any[]) => any>;
        onAdViewWillPresentScreen: PropTypes.Requireable<(...args: any[]) => any>;
        onAdViewWillDismissScreen: PropTypes.Requireable<(...args: any[]) => any>;
        onAdViewDidDismissScreen: PropTypes.Requireable<(...args: any[]) => any>;
        onAdViewWillLeaveApplication: PropTypes.Requireable<(...args: any[]) => any>;
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
