import PropTypes from 'prop-types';
import React from 'react';
import { BaseGLViewProps, ComponentOrHandle, GLSnapshot, SnapshotOptions } from './GLView.types';
export interface GLViewProps extends BaseGLViewProps {
    onContextCreate: (gl: WebGLRenderingContext) => void;
    onContextRestored?: (gl?: WebGLRenderingContext) => void;
    onContextLost?: () => void;
    webglContextAttributes?: WebGLContextAttributes;
    /**
     * [iOS only] Number of samples for Apple's built-in multisampling.
     */
    msaaSamples: number;
    /**
     * A ref callback for the native GLView
     */
    nativeRef_EXPERIMENTAL?(callback: ComponentOrHandle | HTMLCanvasElement | null): any;
}
export declare class GLView extends React.Component<GLViewProps> {
    static propTypes: {
        onContextCreate: PropTypes.Validator<(...args: any[]) => any>;
        onContextRestored: PropTypes.Requireable<(...args: any[]) => any>;
        onContextLost: PropTypes.Requireable<(...args: any[]) => any>;
        webglContextAttributes: PropTypes.Requireable<object>;
        /**
         * [iOS only] Number of samples for Apple's built-in multisampling.
         */
        msaaSamples: PropTypes.Requireable<number>;
        /**
         * A ref callback for the native GLView
         */
        nativeRef_EXPERIMENTAL: PropTypes.Requireable<(...args: any[]) => any>;
    };
    canvas?: HTMLCanvasElement;
    gl?: WebGLRenderingContext;
    static createContextAsync(): Promise<WebGLRenderingContext | null>;
    static destroyContextAsync(exgl?: WebGLRenderingContext | number): Promise<boolean>;
    static takeSnapshotAsync(gl: WebGLRenderingContext, options?: SnapshotOptions): Promise<GLSnapshot>;
    componentWillUnmount(): void;
    render(): JSX.Element;
    componentDidUpdate(prevProps: GLViewProps): void;
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
