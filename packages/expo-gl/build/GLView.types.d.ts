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
    __exglCtxId: number;
    endFrameEXP(): void;
}
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
