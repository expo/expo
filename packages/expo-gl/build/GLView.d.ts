import * as React from 'react';
import { ComponentOrHandle, SurfaceCreateEvent, GLSnapshot, ExpoWebGLRenderingContext, SnapshotOptions, GLViewProps } from './GLView.types';
export type WebGLObject = {
    id: number;
};
export declare function getWorkletContext(contextId: number): ExpoWebGLRenderingContext | undefined;
/**
 * A View that acts as an OpenGL ES render target. On mounting, an OpenGL ES context is created.
 * Its drawing buffer is presented as the contents of the View every frame.
 */
export declare class GLView extends React.Component<GLViewProps> {
    static NativeView: any;
    static defaultProps: {
        msaaSamples: number;
        enableExperimentalWorkletSupport: boolean;
    };
    /**
     * Imperative API that creates headless context which is devoid of underlying view.
     * It's useful for headless rendering or in case you want to keep just one context per application and share it between multiple components.
     * It is slightly faster than usual context as it doesn't swap framebuffers and doesn't present them on the canvas,
     * however it may require you to take a snapshot in order to present its results.
     * Also, keep in mind that you need to set up a viewport and create your own framebuffer and texture that you will be drawing to, before you take a snapshot.
     * @return A promise that resolves to WebGL context object. See [WebGL API](#webgl-api) for more details.
     */
    static createContextAsync(): Promise<ExpoWebGLRenderingContext>;
    /**
     * Destroys given context.
     * @param exgl WebGL context to destroy.
     * @return A promise that resolves to boolean value that is `true` if given context existed and has been destroyed successfully.
     */
    static destroyContextAsync(exgl?: ExpoWebGLRenderingContext | number): Promise<boolean>;
    /**
     * Takes a snapshot of the framebuffer and saves it as a file to app's cache directory.
     * @param exgl WebGL context to take a snapshot from.
     * @param options
     * @return A promise that resolves to `GLSnapshot` object.
     */
    static takeSnapshotAsync(exgl?: ExpoWebGLRenderingContext | number, options?: SnapshotOptions): Promise<GLSnapshot>;
    /**
     * This method doesn't work inside of the worklets with new reanimated versions.
     * @deprecated Use `getWorkletContext` from the global scope instead.
     */
    static getWorkletContext: (contextId: number) => ExpoWebGLRenderingContext | undefined;
    nativeRef: ComponentOrHandle;
    exglCtxId?: number;
    render(): React.JSX.Element;
    _setNativeRef: (nativeRef: ComponentOrHandle) => void;
    _onSurfaceCreate: ({ nativeEvent: { exglCtxId } }: SurfaceCreateEvent) => void;
    componentWillUnmount(): void;
    componentDidUpdate(prevProps: GLViewProps): void;
    startARSessionAsync(): Promise<any>;
    createCameraTextureAsync(cameraRefOrHandle: ComponentOrHandle): Promise<WebGLTexture>;
    destroyObjectAsync(glObject: WebGLObject): Promise<boolean>;
    /**
     * Same as static [`takeSnapshotAsync()`](#takesnapshotasyncoptions),
     * but uses WebGL context that is associated with the view on which the method is called.
     * @param options
     */
    takeSnapshotAsync(options?: SnapshotOptions): Promise<GLSnapshot>;
}
//# sourceMappingURL=GLView.d.ts.map