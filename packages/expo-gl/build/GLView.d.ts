import * as React from 'react';
import { ComponentOrHandle, SurfaceCreateEvent, GLSnapshot, ExpoWebGLRenderingContext, SnapshotOptions, BaseGLViewProps } from './GLView.types';
export interface WebGLObject {
    id: number;
}
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
