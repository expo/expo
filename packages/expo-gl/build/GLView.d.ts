import PropTypes from 'prop-types';
import * as React from 'react';
import { ComponentOrHandle, SurfaceCreateEvent, GLSnapshot, ExpoWebGLRenderingContext, SnapshotOptions, BaseGLViewProps } from './GLView.types';
export declare type GLViewProps = {
    /**
     * Called when the OpenGL context is created, with the context object as a parameter. The context
     * object has an API mirroring WebGL's WebGLRenderingContext.
     */
    onContextCreate(gl: ExpoWebGLRenderingContext): void;
    /**
     * [iOS only] Number of samples for Apple's built-in multisampling.
     */
    msaaSamples: number;
    /**
     * A ref callback for the native GLView
     */
    nativeRef_EXPERIMENTAL?(callback: ComponentOrHandle | null): any;
} & BaseGLViewProps;
/**
 * A component that acts as an OpenGL render target
 */
export declare class GLView extends React.Component<GLViewProps> {
    static NativeView: any;
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
        accessibilityRole?: PropTypes.Validator<"button" | "header" | "link" | "menu" | "menuitem" | "summary" | "image" | "switch" | "text" | "none" | "search" | "keyboardkey" | "adjustable" | "imagebutton" | "alert" | "checkbox" | "combobox" | "menubar" | "progressbar" | "radio" | "radiogroup" | "scrollbar" | "spinbutton" | "tab" | "tablist" | "timer" | "toolbar" | undefined> | undefined;
        accessibilityStates?: PropTypes.Validator<import("react-native").AccessibilityStates[] | undefined> | undefined;
        accessibilityState?: PropTypes.Validator<import("react-native").AccessibilityState | undefined> | undefined;
        accessibilityHint?: PropTypes.Validator<string | undefined> | undefined;
        accessibilityValue?: PropTypes.Validator<import("react-native").AccessibilityValue | undefined> | undefined;
        onAccessibilityAction?: PropTypes.Validator<((event: import("react-native").AccessibilityActionEvent) => void) | undefined> | undefined;
        accessibilityComponentType?: PropTypes.Validator<"button" | "none" | "radiobutton_checked" | "radiobutton_unchecked" | undefined> | undefined;
        accessibilityLiveRegion?: PropTypes.Validator<"none" | "polite" | "assertive" | undefined> | undefined;
        importantForAccessibility?: PropTypes.Validator<"auto" | "yes" | "no" | "no-hide-descendants" | undefined> | undefined;
        accessibilityElementsHidden?: PropTypes.Validator<boolean | undefined> | undefined;
        accessibilityTraits?: PropTypes.Validator<"button" | "header" | "link" | "summary" | "image" | "text" | "none" | "search" | "adjustable" | "disabled" | "selected" | "plays" | "key" | "frequentUpdates" | "startsMedia" | "allowsDirectInteraction" | "pageTurn" | import("react-native").AccessibilityTrait[] | undefined> | undefined;
        accessibilityViewIsModal?: PropTypes.Validator<boolean | undefined> | undefined;
        onAccessibilityEscape?: PropTypes.Validator<(() => void) | undefined> | undefined;
        onAccessibilityTap?: PropTypes.Validator<(() => void) | undefined> | undefined;
        onMagicTap?: PropTypes.Validator<(() => void) | undefined> | undefined;
        accessibilityIgnoresInvertColors?: PropTypes.Validator<boolean | undefined> | undefined;
        onContextCreate: PropTypes.Requireable<(...args: any[]) => any>;
        msaaSamples: PropTypes.Requireable<number>;
        nativeRef_EXPERIMENTAL: PropTypes.Requireable<(...args: any[]) => any>;
    };
    static defaultProps: {
        msaaSamples: number;
    };
    static createContextAsync(): Promise<ExpoWebGLRenderingContext>;
    static destroyContextAsync(exgl?: ExpoWebGLRenderingContext | number): Promise<boolean>;
    static takeSnapshotAsync(exgl?: ExpoWebGLRenderingContext | number, options?: SnapshotOptions): Promise<GLSnapshot>;
    nativeRef: ComponentOrHandle;
    exglCtxId?: number;
    render(): JSX.Element;
    _setNativeRef: (nativeRef: ComponentOrHandle) => void;
    _onSurfaceCreate: ({ nativeEvent: { exglCtxId } }: SurfaceCreateEvent) => void;
    startARSessionAsync(): Promise<any>;
    createCameraTextureAsync(cameraRefOrHandle: ComponentOrHandle): Promise<WebGLTexture>;
    destroyObjectAsync(glObject: WebGLObject): Promise<boolean>;
    takeSnapshotAsync(options?: SnapshotOptions): Promise<GLSnapshot>;
}
declare type WebGLObjectId = any;
export declare class WebGLObject {
    id: WebGLObjectId;
    constructor(id: WebGLObjectId);
    toString(): string;
}
declare class WebGLTexture extends WebGLObject {
}
export {};
