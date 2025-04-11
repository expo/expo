import * as React from 'react';
import { WebGLObject } from './GLView';
import { GLViewProps, GLSnapshot, SnapshotOptions, ComponentOrHandle } from './GLView.types';
export type GLViewWebProps = GLViewProps & {
    onContextCreate: (gl: WebGLRenderingContext) => void;
    onContextRestored?: (gl?: WebGLRenderingContext) => void;
    onContextLost?: () => void;
    webglContextAttributes?: WebGLContextAttributes;
    nativeRef_EXPERIMENTAL?(callback: ComponentOrHandle | HTMLCanvasElement | null): unknown;
};
export declare class GLView extends React.Component<GLViewWebProps> {
    canvas?: HTMLCanvasElement;
    gl?: WebGLRenderingContext;
    static createContextAsync(): Promise<WebGLRenderingContext | null>;
    static destroyContextAsync(exgl?: WebGLRenderingContext | number): Promise<boolean>;
    static takeSnapshotAsync(gl: WebGLRenderingContext, options?: SnapshotOptions): Promise<GLSnapshot>;
    componentWillUnmount(): void;
    render(): React.JSX.Element;
    componentDidUpdate(prevProps: GLViewWebProps): void;
    private getGLContextOrReject;
    private onContextLost;
    private onContextRestored;
    private getGLContext;
    private setCanvasRef;
    takeSnapshotAsync(options?: SnapshotOptions): Promise<GLSnapshot>;
    startARSessionAsync(): Promise<void>;
    createCameraTextureAsync(): Promise<void>;
    destroyObjectAsync(glObject: WebGLObject): Promise<void>;
}
//# sourceMappingURL=GLView.web.d.ts.map