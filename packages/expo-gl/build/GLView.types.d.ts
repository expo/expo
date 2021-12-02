import { Component, ComponentClass } from 'react';
import { ViewProps } from 'react-native';
import WebGL2RenderingContext from './WebGL2RenderingContext';
export declare type SurfaceCreateEvent = {
    nativeEvent: {
        exglCtxId: number;
    };
};
export declare type SnapshotOptions = {
    flip?: boolean;
    framebuffer?: WebGLFramebuffer;
    rect?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    format?: 'jpeg' | 'png';
    compress?: number;
};
export declare type GLSnapshot = {
    uri: string | Blob | null;
    localUri: string;
    width: number;
    height: number;
};
export interface ExpoWebGLRenderingContext extends WebGL2RenderingContext {
    exglCtxId: number;
    endFrameEXP(): void;
    __expoSetLogging(option: GLLoggingOption): void;
}
export declare type ComponentOrHandle = null | number | Component<any, any> | ComponentClass<any>;
/**
 *
 * A View that acts as an OpenGL ES render target. On mounting, an OpenGL ES
 * context is created. Its drawing buffer is presented as the contents of
 * the View every frame.
 */
export interface BaseGLViewProps extends ViewProps {
    /**
     * Called when the OpenGL context is created, with the context object as a parameter. The context
     * object has an API mirroring WebGL's WebGLRenderingContext.
     */
    onContextCreate(gl: ExpoWebGLRenderingContext): void;
    /**
     * [iOS only] Number of samples for Apple's built-in multisampling.
     */
    msaaSamples?: number;
}
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
