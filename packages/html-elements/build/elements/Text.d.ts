import React from 'react';
import { TextProps } from '../primitives/Text';
import { ViewProps } from '../primitives/View';
export declare const P: React.ComponentType<TextProps>;
export declare const B: React.ComponentType<TextProps>;
export declare const S: React.ComponentType<TextProps>;
export declare const I: React.ComponentType<TextProps>;
export declare const Q: React.ComponentType<React.PropsWithChildren<Pick<import("react-native").TextProps & React.ClassAttributes<typeof import("react-native").Text>, "allowFontScaling" | "ellipsizeMode" | "lineBreakMode" | "numberOfLines" | "onLayout" | "onPress" | "onLongPress" | "testID" | "nativeID" | "maxFontSizeMultiplier" | "adjustsFontSizeToFit" | "minimumFontScale" | "suppressHighlighting" | "selectable" | "selectionColor" | "textBreakStrategy" | "accessible" | "accessibilityActions" | "accessibilityLabel" | "accessibilityStates" | "accessibilityState" | "accessibilityHint" | "accessibilityValue" | "onAccessibilityAction" | "accessibilityComponentType" | "accessibilityLiveRegion" | "importantForAccessibility" | "accessibilityElementsHidden" | "accessibilityTraits" | "accessibilityViewIsModal" | "onAccessibilityEscape" | "onAccessibilityTap" | "onMagicTap" | "accessibilityIgnoresInvertColors" | "key" | "ref"> & import("../primitives/Text").WebTextProps & {
    cite?: string | undefined;
}>>;
export declare const BlockQuote: React.ComponentType<React.PropsWithChildren<import("../primitives/View").WebViewProps & Pick<import("react-native").ViewProps & React.ClassAttributes<typeof import("react-native").View>, "onLayout" | "testID" | "nativeID" | "accessible" | "accessibilityActions" | "accessibilityLabel" | "accessibilityStates" | "accessibilityState" | "accessibilityHint" | "accessibilityValue" | "onAccessibilityAction" | "accessibilityComponentType" | "accessibilityLiveRegion" | "importantForAccessibility" | "accessibilityElementsHidden" | "accessibilityTraits" | "accessibilityViewIsModal" | "onAccessibilityEscape" | "onAccessibilityTap" | "onMagicTap" | "accessibilityIgnoresInvertColors" | "key" | "ref" | "hitSlop" | "pointerEvents" | "removeClippedSubviews" | "collapsable" | "needsOffscreenAlphaCompositing" | "renderToHardwareTextureAndroid" | "shouldRasterizeIOS" | "isTVSelectable" | "hasTVPreferredFocus" | "tvParallaxProperties" | "tvParallaxShiftDistanceX" | "tvParallaxShiftDistanceY" | "tvParallaxTiltAngle" | "tvParallaxMagnification" | "onStartShouldSetResponder" | "onMoveShouldSetResponder" | "onResponderEnd" | "onResponderGrant" | "onResponderReject" | "onResponderMove" | "onResponderRelease" | "onResponderStart" | "onResponderTerminationRequest" | "onResponderTerminate" | "onStartShouldSetResponderCapture" | "onMoveShouldSetResponderCapture" | "onTouchStart" | "onTouchMove" | "onTouchEnd" | "onTouchCancel" | "onTouchEndCapture"> & {
    cite?: string | undefined;
}>>;
export declare const BR: React.ComponentType<TextProps>;
export declare const Mark: React.ComponentType<TextProps>;
export declare const Code: React.ComponentType<TextProps>;
declare type PreProps = TextProps | ViewProps;
export declare const Pre: React.ComponentType<PreProps>;
export declare const Time: React.ComponentType<React.PropsWithChildren<Pick<import("react-native").TextProps & React.ClassAttributes<typeof import("react-native").Text>, "allowFontScaling" | "ellipsizeMode" | "lineBreakMode" | "numberOfLines" | "onLayout" | "onPress" | "onLongPress" | "testID" | "nativeID" | "maxFontSizeMultiplier" | "adjustsFontSizeToFit" | "minimumFontScale" | "suppressHighlighting" | "selectable" | "selectionColor" | "textBreakStrategy" | "accessible" | "accessibilityActions" | "accessibilityLabel" | "accessibilityStates" | "accessibilityState" | "accessibilityHint" | "accessibilityValue" | "onAccessibilityAction" | "accessibilityComponentType" | "accessibilityLiveRegion" | "importantForAccessibility" | "accessibilityElementsHidden" | "accessibilityTraits" | "accessibilityViewIsModal" | "onAccessibilityEscape" | "onAccessibilityTap" | "onMagicTap" | "accessibilityIgnoresInvertColors" | "key" | "ref"> & import("../primitives/Text").WebTextProps & {
    dateTime?: string | undefined;
}>>;
export declare const Strong: React.ComponentType<TextProps>;
export declare const Del: React.ComponentType<TextProps>;
export declare const EM: React.ComponentType<TextProps>;
export {};
