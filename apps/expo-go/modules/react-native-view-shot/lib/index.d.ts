import React, { ReactNode } from 'react';
import { View, StyleProp, ViewStyle, LayoutChangeEvent } from 'react-native';
export interface CaptureOptions {
  /**
   * (Android only) the file name of the file. Must be at least 3 characters long.
   */
  fileName?: string;
  /**
   * the width and height of the final image (resized from the View bound. don't provide it if you want
   * the original pixel size).
   */
  width?: number;
  /**
   * @see {CaptureOptions#width}
   */
  height?: number;
  /**
   * either png, jpg, webp (Android), or raw (Android, ARGB pixel array). Defaults to png.
   * `webm` is accepted as a deprecated alias for `webp` (it has always produced WEBP-encoded
   * data — the extension was misnamed).
   */
  format?: 'jpg' | 'png' | 'webp' | 'webm' | 'raw';
  /**
   * the quality. 0.0 - 1.0 (default). (only available on lossy formats like jpg)
   */
  quality?: number;
  /**
   * the method you want to use to save the snapshot, one of:
   * - tmpfile (default): save to a temporary file (that will only exist for as long as the app is running).
   * - base64: encode as base64 and returns the raw string. Use only with small images as this may result of
   *   lags (the string is sent over the bridge). N.B. This is not a data uri, use data-uri instead.
   * - data-uri: same as base64 but also includes the Data URI scheme header.
   * - zip-base64: compress data with zip deflate algorithm and than convert to base64 and return as a raw string.
   */
  result?: 'tmpfile' | 'base64' | 'data-uri' | 'zip-base64';
  /**
   * if true and when view is a ScrollView, the "content container" height will be evaluated instead of the
   * container height.
   *
   * Not supported on Windows.
   */
  snapshotContentContainer?: boolean;
  /**
   * if true and when view is a SurfaceView or have it in the view tree, view will be captured.
   * False by default, because it can have significant performance impact
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
   */
  onCapture?(uri: string): void;
  /**
   * when a captureMode is defined, this callback will be called when a capture fails.
   */
  onCaptureFailure?(error: Error): void;
  /**
   * Invoked on mount and layout changes
   */
  onLayout?(event: LayoutChangeEvent): void;
  /**
   * style prop as StyleProp<ViewStyle>
   */
  style?: StyleProp<ViewStyle>;
}
interface HostElement {
  readonly nodeType: number;
}
type CaptureTarget =
  | number
  | React.Component
  | HostElement
  | React.RefObject<React.Component | HostElement | null>
  | null;
export declare function captureRef(
  view: CaptureTarget,
  optionsObject?: CaptureOptions
): Promise<string>;
export declare function releaseCapture(uri: string): void;
export declare function captureScreen(optionsObject?: CaptureOptions): Promise<string>;
/**
 * Ref handle exposed by ViewShot component.
 *
 * The ref points to the inner host View so that `findNodeHandle(ref.current)`
 * (used by `captureRef(ref, options)`) keeps working as in v4. A `capture()`
 * method is attached to that node for the imperative `ref.current.capture()`
 * usage.
 */
export type ViewShotRef = View & {
  capture: () => Promise<string>;
};
declare const ViewShotComponent: React.ForwardRefExoticComponent<
  ViewShotProperties & React.RefAttributes<ViewShotRef>
>;
declare const ViewShot: typeof ViewShotComponent & {
  captureRef: typeof captureRef;
  releaseCapture: typeof releaseCapture;
};
export default ViewShot;
//# sourceMappingURL=index.d.ts.map
