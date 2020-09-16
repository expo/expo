import * as React from 'react';
import { ViewProps } from 'react-native';
import { PermissionResponse, PermissionStatus } from 'unimodules-permissions-interface';
export declare type BarCodePoint = {
    x: number;
    y: number;
};
export declare type BarCodeSize = {
    height: number;
    width: number;
};
export declare type BarCodeBounds = {
    origin: BarCodePoint;
    size: BarCodeSize;
};
export declare type BarCodeScannerResult = {
    type: string;
    data: string;
    bounds?: BarCodeBounds;
    cornerPoints?: BarCodePoint[];
};
export declare type BarCodeEvent = BarCodeScannerResult & {
    target?: number;
};
export declare type BarCodeEventCallbackArguments = {
    nativeEvent: BarCodeEvent;
};
export declare type BarCodeScannedCallback = (params: BarCodeEvent) => void;
export { PermissionResponse, PermissionStatus };
export interface BarCodeScannerProps extends ViewProps {
    type?: 'front' | 'back' | number;
    barCodeTypes?: string[];
    onBarCodeScanned: BarCodeScannedCallback;
}
export declare class BarCodeScanner extends React.Component<BarCodeScannerProps> {
    lastEvents: {
        [key: string]: any;
    };
    lastEventsTimes: {
        [key: string]: any;
    };
    static Constants: {
        BarCodeType: any;
        Type: any;
    };
    static ConversionTables: {
        type: any;
    };
    static defaultProps: {
        type: any;
        barCodeTypes: unknown[];
    };
    static getPermissionsAsync(): Promise<PermissionResponse>;
    static requestPermissionsAsync(): Promise<PermissionResponse>;
    static scanFromURLAsync(url: string, barCodeTypes?: string[]): Promise<BarCodeScannerResult[]>;
    render(): JSX.Element;
    onObjectDetected: (callback?: BarCodeScannedCallback | undefined) => ({ nativeEvent, }: BarCodeEventCallbackArguments) => void;
    convertNativeProps(props: BarCodeScannerProps): {
        type?: any;
        barCodeTypes?: any;
        onBarCodeScanned: any;
        hitSlop?: any;
        onLayout?: any;
        pointerEvents?: any;
        removeClippedSubviews?: any;
        style?: any;
        testID?: any;
        nativeID?: any;
        collapsable?: any;
        needsOffscreenAlphaCompositing?: any;
        renderToHardwareTextureAndroid?: any;
        focusable?: any;
        shouldRasterizeIOS?: any;
        isTVSelectable?: any;
        hasTVPreferredFocus?: any;
        tvParallaxProperties?: any;
        tvParallaxShiftDistanceX?: any;
        tvParallaxShiftDistanceY?: any;
        tvParallaxTiltAngle?: any;
        tvParallaxMagnification?: any;
        onStartShouldSetResponder?: any;
        onMoveShouldSetResponder?: any;
        onResponderEnd?: any;
        onResponderGrant?: any;
        onResponderReject?: any;
        onResponderMove?: any;
        onResponderRelease?: any;
        onResponderStart?: any;
        onResponderTerminationRequest?: any;
        onResponderTerminate?: any;
        onStartShouldSetResponderCapture?: any;
        onMoveShouldSetResponderCapture?: any;
        onTouchStart?: any;
        onTouchMove?: any;
        onTouchEnd?: any;
        onTouchCancel?: any;
        onTouchEndCapture?: any;
        accessible?: any;
        accessibilityActions?: any;
        accessibilityLabel?: any;
        accessibilityRole?: any;
        accessibilityState?: any;
        accessibilityHint?: any;
        accessibilityValue?: any;
        onAccessibilityAction?: any;
        accessibilityComponentType?: any;
        accessibilityLiveRegion?: any;
        importantForAccessibility?: any;
        accessibilityElementsHidden?: any;
        accessibilityTraits?: any;
        accessibilityViewIsModal?: any;
        onAccessibilityEscape?: any;
        onAccessibilityTap?: any;
        onMagicTap?: any;
        accessibilityIgnoresInvertColors?: any;
    };
    convertProp(value: any, key: string): any;
}
export declare const Constants: {
    BarCodeType: any;
    Type: any;
}, getPermissionsAsync: typeof BarCodeScanner.getPermissionsAsync, requestPermissionsAsync: typeof BarCodeScanner.requestPermissionsAsync;
