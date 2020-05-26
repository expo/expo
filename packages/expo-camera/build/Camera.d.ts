import PropTypes from 'prop-types';
import React from 'react';
import { CameraCapturedPicture, CameraNativeProps, CameraPictureOptions, CameraProps, CameraRecordingOptions, PermissionResponse, PermissionStatus, PermissionExpiration, BarCodeScanningResult, FaceDetectionResult, CameraMountError } from './Camera.types';
export default class Camera extends React.Component<CameraProps> {
    static isAvailableAsync(): Promise<boolean>;
    static getAvailableCameraTypesAsync(): Promise<('front' | 'back')[]>;
    static Constants: {
        Type: any;
        FlashMode: any;
        AutoFocus: any;
        WhiteBalance: any;
        VideoQuality: any;
        VideoStabilization: any;
    };
    static ConversionTables: {
        type: any;
        flashMode: any;
        autoFocus: any;
        whiteBalance: any;
    };
    static propTypes: {
        zoom: PropTypes.Requireable<number>;
        ratio: PropTypes.Requireable<string>;
        focusDepth: PropTypes.Requireable<number>;
        onMountError: PropTypes.Requireable<(...args: any[]) => any>;
        pictureSize: PropTypes.Requireable<string>;
        onCameraReady: PropTypes.Requireable<(...args: any[]) => any>;
        useCamera2Api: PropTypes.Requireable<boolean>;
        onBarCodeScanned: PropTypes.Requireable<(...args: any[]) => any>;
        barCodeScannerSettings: PropTypes.Requireable<object>;
        onFacesDetected: PropTypes.Requireable<(...args: any[]) => any>;
        faceDetectorSettings: PropTypes.Requireable<object>;
        type: PropTypes.Requireable<string | number>;
        flashMode: PropTypes.Requireable<string | number>;
        videoStabilizationMode: PropTypes.Requireable<number>;
        whiteBalance: PropTypes.Requireable<string | number>;
        autoFocus: PropTypes.Requireable<string | number | boolean>;
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
        shouldRasterizeIOS?: PropTypes.Validator<boolean | undefined> | undefined;
        isTVSelectable?: PropTypes.Validator<boolean | undefined> | undefined;
        hasTVPreferredFocus?: PropTypes.Validator<boolean | undefined> | undefined;
        tvParallaxProperties?: PropTypes.Validator<import("react-native").TVParallaxProperties | undefined> | undefined;
        tvParallaxShiftDistanceX?: PropTypes.Validator<number | undefined> | undefined;
        tvParallaxShiftDistanceY?: PropTypes.Validator<number | undefined> | undefined;
        tvParallaxTiltAngle?: PropTypes.Validator<number | undefined> | undefined;
        tvParallaxMagnification?: PropTypes.Validator<number | undefined> | undefined;
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
        accessibilityActions?: PropTypes.Validator<readonly Readonly<{
            name: import("react-native").AccessibilityActionName;
            label?: string | undefined;
        }>[] | undefined> | undefined;
        accessibilityLabel?: PropTypes.Validator<string | undefined> | undefined;
        accessibilityRole?: PropTypes.Validator<"none" | "button" | "link" | "search" | "image" | "keyboardkey" | "text" | "adjustable" | "imagebutton" | "header" | "summary" | "alert" | "checkbox" | "combobox" | "menu" | "menubar" | "menuitem" | "progressbar" | "radio" | "radiogroup" | "scrollbar" | "spinbutton" | "switch" | "tab" | "tablist" | "timer" | "toolbar" | undefined> | undefined;
        accessibilityState?: PropTypes.Validator<import("react-native").AccessibilityState | undefined> | undefined;
        accessibilityHint?: PropTypes.Validator<string | undefined> | undefined;
        accessibilityValue?: PropTypes.Validator<import("react-native").AccessibilityValue | undefined> | undefined;
        onAccessibilityAction?: PropTypes.Validator<((event: import("react-native").AccessibilityActionEvent) => void) | undefined> | undefined;
        accessibilityComponentType?: PropTypes.Validator<"none" | "button" | "radiobutton_checked" | "radiobutton_unchecked" | undefined> | undefined;
        accessibilityLiveRegion?: PropTypes.Validator<"none" | "polite" | "assertive" | undefined> | undefined;
        importantForAccessibility?: PropTypes.Validator<"auto" | "yes" | "no" | "no-hide-descendants" | undefined> | undefined;
        accessibilityElementsHidden?: PropTypes.Validator<boolean | undefined> | undefined;
        accessibilityTraits?: PropTypes.Validator<"none" | "button" | "link" | "search" | "image" | "text" | "adjustable" | "header" | "summary" | "selected" | "plays" | "key" | "disabled" | "frequentUpdates" | "startsMedia" | "allowsDirectInteraction" | "pageTurn" | import("react-native").AccessibilityTrait[] | undefined> | undefined;
        accessibilityViewIsModal?: PropTypes.Validator<boolean | undefined> | undefined;
        onAccessibilityEscape?: PropTypes.Validator<(() => void) | undefined> | undefined;
        onAccessibilityTap?: PropTypes.Validator<(() => void) | undefined> | undefined;
        onMagicTap?: PropTypes.Validator<(() => void) | undefined> | undefined;
        accessibilityIgnoresInvertColors?: PropTypes.Validator<boolean | undefined> | undefined;
    };
    static defaultProps: CameraProps;
    static getPermissionsAsync(): Promise<PermissionResponse>;
    static requestPermissionsAsync(): Promise<PermissionResponse>;
    _cameraHandle?: number | null;
    _cameraRef?: React.Component | null;
    _lastEvents: {
        [eventName: string]: string;
    };
    _lastEventsTimes: {
        [eventName: string]: Date;
    };
    takePictureAsync(options?: CameraPictureOptions): Promise<CameraCapturedPicture>;
    getSupportedRatiosAsync(): Promise<string[]>;
    getAvailablePictureSizesAsync(ratio?: string): Promise<string[]>;
    recordAsync(options?: CameraRecordingOptions): Promise<{
        uri: string;
    }>;
    stopRecording(): void;
    pausePreview(): void;
    resumePreview(): void;
    _onCameraReady: () => void;
    _onMountError: ({ nativeEvent }: {
        nativeEvent: {
            message: string;
        };
    }) => void;
    _onObjectDetected: (callback?: Function | undefined) => ({ nativeEvent }: {
        nativeEvent: any;
    }) => void;
    _setReference: (ref?: React.Component<{}, {}, any> | undefined) => void;
    render(): JSX.Element;
}
export declare const Constants: {
    Type: any;
    FlashMode: any;
    AutoFocus: any;
    WhiteBalance: any;
    VideoQuality: any;
    VideoStabilization: any;
}, getPermissionsAsync: typeof Camera.getPermissionsAsync, requestPermissionsAsync: typeof Camera.requestPermissionsAsync;
export { CameraCapturedPicture, CameraNativeProps, CameraPictureOptions, CameraProps, CameraRecordingOptions, PermissionResponse, PermissionStatus, PermissionExpiration, BarCodeScanningResult, FaceDetectionResult, CameraMountError, };
