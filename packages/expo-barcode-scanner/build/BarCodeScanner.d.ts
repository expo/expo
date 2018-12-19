import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
declare type BarCodeType = any;
declare type EventCallbackArgumentsType = {
    nativeEvent: any;
};
declare type Props = React.ComponentProps<typeof View> & {
    onBarCodeScanned: (EventCallbackArgumentsType: any) => void;
    barCodeTypes?: Array<BarCodeType>;
    type?: string | number;
};
export default class BarCodeScanner extends React.Component<Props> {
    lastEvents: any;
    lastEventsTimes: any;
    barCodeScannerRef?: any;
    barCodeScannerHandle?: number | null;
    static Constants: {
        BarCodeType: any;
        Type: any;
    };
    static ConversionTables: {
        type: any;
    };
    static propTypes: {
        onBarCodeScanned: PropTypes.Requireable<(...args: any[]) => any>;
        barCodeTypes: PropTypes.Requireable<any[]>;
        type: PropTypes.Requireable<React.ReactText>;
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
    };
    static defaultProps: {
        type: any;
        barCodeTypes: {}[];
    };
    constructor(props: Props);
    static scanFromURLAsync(url: string, barCodeTypes: Array<BarCodeType>): Promise<any>;
    render(): JSX.Element;
    setReference: (ref?: React.Component<{}, {}, any> | undefined) => void;
    onObjectDetected: (callback?: Function | undefined) => ({ nativeEvent }: EventCallbackArgumentsType) => void;
    convertNativeProps(props: Props): any;
    convertProp(value: any, key: string): any;
}
export declare const Constants: {
    BarCodeType: any;
    Type: any;
};
export {};
