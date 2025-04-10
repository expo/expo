/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-11-11 16:03:17
 * @version 1.0.0
 * @desc react-native-view-shot.d.ts
 */

declare module 'react-native-view-shot' {
    import { Component, ReactInstance, RefObject, ReactNode } from 'react'
    import { StyleProp, ViewStyle } from 'react-native'
    import { LayoutChangeEvent } from 'react-native'


    export interface CaptureOptions {
        /**
         * (Android only) the file name of the file. Must be at least 3 characters long.
         */
        fileName?: string;
        /**
         * (number): the width and height of the final image (resized from the View bound. don't provide it if you want
         * the original pixel size).
         */
        width?: number;
        /**
         * @see {CaptureOptions#width}
         */
        height?: number;
        /**
         * either png or jpg or webm (Android). Defaults to png. raw is a ARGB array of image pixels.
         */
        format?: 'jpg' | 'png' | 'webm' | 'raw';
        /**
         * the quality. 0.0 - 1.0 (default). (only available on lossy formats like jpg)
         */
        quality?: number;
        /**
         * the method you want to use to save the snapshot, one of:
         " - tmpfile" (default): save to a temporary file (that will only exist for as long as the app is running).
         " - base64": encode as base64 and returns the raw string. Use only with small images as this may result of
         *   lags (the string is sent over the bridge). N.B. This is not a data uri, use data-uri instead.
         " - data-uri": same as base64 but also includes the Data URI scheme header.
         " - zip-base64: compress data with zip deflate algorithm and than convert to base64 and return as a raw string."
         */
        result?: 'tmpfile' | 'base64' | 'data-uri' | 'zip-base64';
        /**
         * if true and when view is a ScrollView, the "content container" height will be evaluated instead of the
         * container height.
         */
        snapshotContentContainer?: boolean;
        /**
         * if true and when view is a SurfaceView or have it in the view tree, view will be captured.
         * False by default, because it can have signoficant performance impact
         */
        handleGLSurfaceViewOnAndroid?: boolean;
        /**
         * (iOS only) change the iOS snapshot strategy to use method renderInContext instead of drawViewHierarchyInRect 
         * which may help for some use cases.
         */
        useRenderInContext?: boolean;
    }

    export interface ViewShotProperties {
        options?: CaptureOptions;
        /**
         * - if not defined (default). the capture is not automatic and you need to use the ref and call capture()
         *   yourself.
         * - "mount". Capture the view once at mount. (It is important to understand image loading won't be waited, in
         *   such case you want to use "none" with viewShotRef.capture() after Image#onLoad.)
         * - "continuous" EXPERIMENTAL, this will capture A LOT of images continuously. For very specific use-cases.
         * - "update" EXPERIMENTAL, this will capture images each time React redraw (on did update). For very specific
         *   use-cases.
         */
        captureMode?: 'mount' | 'continuous' | 'update';
        /**
         * children of ViewShot component
         */
        children?: ReactNode;
        /**
         * when a captureMode is defined, this callback will be called with the capture result.
         * @param {string} uri
         */
        onCapture?(uri: string): void;
        /**
         * when a captureMode is defined, this callback will be called when a capture fails.
         * @param {Error} error
         */
        onCaptureFailure?(error: Error): void;
        /**
         * Invoked on mount and layout changes
         * @param {LayoutChangeEvent} event
         */
        onLayout?(event: LayoutChangeEvent): void;
        /**
         * style prop as StyleProp<ViewStyle>
         */
        style?: StyleProp<ViewStyle>;
    }

    export default class ViewShot extends Component<React.PropsWithChildren<ViewShotProperties>> {
        capture?(): Promise<string>;
    }

    /**
     * lower level imperative API
     *
     * @param {number | React.ReactInstance | RefObject} viewRef
     * @param {"react-native-view-shot".CaptureOptions} options
     * @return {Promise<string>} Returns a Promise of the image URI.
     */
    export function captureRef<T>(viewRef: number | ReactInstance | RefObject<T>, options?: CaptureOptions): Promise<string>

    /**
     * This method release a previously captured uri. For tmpfile it will clean them out, for other result types it
     * just won't do anything.
     *
     * NB: the tmpfile captures are automatically cleaned out after the app closes, so you might not have to worry
     *  about this unless advanced usecases. The ViewShot component will use it each time you capture more than once
     * (useful for continuous capture to not leak files).
     * @param {string} uri
     */
    export function releaseCapture(uri: string): void

    /**
     * This method will capture the contents of the currently displayed screen as a native hardware screenshot. It does
     * not require a ref input, as it does not work at the view level. This means that ScrollViews will not be captured
     * in their entirety - only the portions currently visible to the user.
     *
     * Returns a Promise of the image URI.
     *
     * @param {"react-native-view-shot".CaptureOptions} options
     * @return {Promise<string>}
     */
    export function captureScreen(options?: CaptureOptions): Promise<string>
}
