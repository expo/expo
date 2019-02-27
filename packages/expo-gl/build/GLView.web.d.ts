import PropTypes from 'prop-types';
import React from 'react';
import { BaseGLViewProps, GLSnapshot, ExpoWebGLRenderingContext, SnapshotOptions } from './GLView.types';
export { BaseGLViewProps, ExpoWebGLRenderingContext, SnapshotOptions, GLViewProps };
interface GLViewProps extends BaseGLViewProps {
    onContextCreate: (gl: WebGLRenderingContext) => void;
    onContextRestored?: (gl?: WebGLRenderingContext) => void;
    onContextLost?: () => void;
    webglContextAttributes?: WebGLContextAttributes;
}
declare type State = {
    width: number;
    height: number;
};
export declare class GLView extends React.Component<GLViewProps, State> {
    state: {
        width: number;
        height: number;
    };
    static propTypes: {
        onContextCreate: PropTypes.Validator<(...args: any[]) => any>;
        onContextRestored: PropTypes.Requireable<(...args: any[]) => any>;
        onContextLost: PropTypes.Requireable<(...args: any[]) => any>;
        webglContextAttributes: PropTypes.Requireable<object>;
    };
    _hasContextBeenCreated: boolean;
    _webglContextAttributes: WebGLContextAttributes | undefined;
    canvas: HTMLCanvasElement | undefined;
    container?: HTMLElement;
    gl?: WebGLRenderingContext;
    static createContextAsync(): Promise<WebGLRenderingContext>;
    static destroyContextAsync(exgl?: WebGLRenderingContext | number): Promise<boolean>;
    static takeSnapshotAsync(exgl: WebGLRenderingContext, options?: SnapshotOptions): Promise<GLSnapshot>;
    componentDidMount(): void;
    _contextCreated: () => void;
    componentWillUnmount(): void;
    _updateLayout: () => void;
    render(): JSX.Element;
    componentDidUpdate(): void;
    _createContext(): WebGLRenderingContext;
    _getGlOrReject(): WebGLRenderingContext;
    _contextLost: (event: Event) => void;
    _contextRestored: () => void;
    _assignCanvasRef: (canvas: HTMLCanvasElement) => void;
    _assignContainerRef: (element: HTMLElement | null) => void;
    takeSnapshotAsync(options?: SnapshotOptions): Promise<GLSnapshot>;
    startARSessionAsync(): Promise<void>;
    createCameraTextureAsync(): Promise<void>;
    destroyObjectAsync(glObject: WebGLObject): Promise<void>;
}
