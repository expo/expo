import { Component, ComponentClass } from 'react';
import { ViewProps } from 'react-native';
export type SurfaceCreateEvent = {
    nativeEvent: {
        exglCtxId: number;
    };
};
export type SnapshotOptions = {
    /**
     * Whether to flip the snapshot vertically.
     * @default false
     */
    flip?: boolean;
    /**
     * Specify the framebuffer that we will be reading from.
     * Defaults to underlying framebuffer that is presented in the view or the current framebuffer if context is headless.
     */
    framebuffer?: WebGLFramebuffer;
    /**
     * Rect to crop the snapshot. It's passed directly to `glReadPixels`.
     */
    rect?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    /**
     * Specifies what type of compression should be used and what is the result file extension.
     * PNG compression is lossless but slower, JPEG is faster but the image has visible artifacts.
     * > **Note:** When using WebP format, the iOS version will print a warning, and generate a `'png'` file instead.
     * > It is recommended to use [platform-specific](https://reactnative.dev/docs/platform-specific-code) code in this case.
     * @default 'jpeg'
     */
    format?: 'jpeg' | 'png' | 'webp';
    /**
     * A value in range `0` to `1.0` specifying compression level of the result image.
     * `1.0` means no compression and `0` the highest compression.
     * @default 1.0
     */
    compress?: number;
};
export type GLSnapshot = {
    /**
     * URI to the snapshot.
     */
    uri: string | Blob | null;
    /**
     * Synonym for `uri`. Makes snapshot object compatible with `texImage2D`.
     */
    localUri: string;
    /**
     * Width of the snapshot.
     */
    width: number;
    /**
     * Height of the snapshot.
     */
    height: number;
};
export interface ExpoWebGLRenderingContext extends WebGL2RenderingContext {
    contextId: number;
    endFrameEXP(): void;
    flushEXP(): void;
    __expoSetLogging(option: GLLoggingOption): void;
}
export type ComponentOrHandle = null | number | Component<any, any> | ComponentClass<any>;
export type GLViewProps = {
    /**
     * A function that will be called when the OpenGL ES context is created.
     * The function is passed a single argument `gl` that extends a [WebGLRenderingContext](https://www.khronos.org/registry/webgl/specs/latest/1.0/#5.14) interface.
     */
    onContextCreate(gl: ExpoWebGLRenderingContext): void;
    /**
     * `GLView` can enable iOS's built-in [multisampling](https://www.khronos.org/registry/OpenGL/extensions/APPLE/APPLE_framebuffer_multisample.txt).
     * This prop specifies the number of samples to use. Setting this to `0` turns off multisampling.
     * @platform ios
     * @default 4
     */
    msaaSamples: number;
    /**
     * Enables support for interacting with a `gl` object from code running on the Reanimated worklet thread.
     * @default false
     */
    enableExperimentalWorkletSupport: boolean;
    /**
     * @hidden
     * A ref callback for the native GLView
     */
    nativeRef_EXPERIMENTAL?(callback: ComponentOrHandle | null): any;
} & ViewProps;
export declare enum GLLoggingOption {
    /**
     * Disables logging entirely.
     */
    DISABLED = 0,
    /**
     * Logs method calls, their parameters and results.
     */
    METHOD_CALLS = 1,
    /**
     * Calls `gl.getError()` after each other method call and prints an error if any is returned.
     * This option has a significant impact on the performance as this method is blocking.
     */
    GET_ERRORS = 2,
    /**
     * Resolves parameters of type `number` to their constant names.
     */
    RESOLVE_CONSTANTS = 4,
    /**
     * When this option is enabled, long strings will be truncated.
     * It's useful if your shaders are really big and logging them significantly reduces performance.
     */
    TRUNCATE_STRINGS = 8,
    /**
     * Enables all other options. It implies `GET_ERRORS` so be aware of the slowdown.
     */
    ALL = 15
}
//# sourceMappingURL=GLView.types.d.ts.map