import PropTypes from 'prop-types';
import React from 'react';
import { SnapshotOptions, GLViewProps } from './GLView.types';
interface WebGLViewProps extends GLViewProps {
    onContextCreate: (gl: WebGLRenderingContext) => void;
    onContextRestored?: (gl?: WebGLRenderingContext) => void;
    onContextLost?: () => void;
    webglContextAttributes?: WebGLContextAttributes;
}
declare type State = {
    width: number;
    height: number;
};
export default class GLView extends React.Component<WebGLViewProps, State> {
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
    static destroyContextAsync(exgl?: WebGLRenderingContext | number): Promise<void>;
    static takeSnapshotAsync(exgl: WebGLRenderingContext, options?: SnapshotOptions): Promise<Blob | null>;
    componentDidMount(): void;
    _contextCreated: () => void;
    componentWillUnmount(): void;
    _updateLayout: () => void;
    render(): JSX.Element;
    componentDidUpdate(prev: any, prevState: any): void;
    _createContext(): WebGLRenderingContext;
    _contextLost: (event: Event) => void;
    _contextRestored: () => void;
    _assignCanvasRef: (canvas: HTMLCanvasElement) => void;
    _assignContainerRef: (element: HTMLElement | null) => void;
    startARSessionAsync(): Promise<void>;
    createCameraTextureAsync(): Promise<void>;
    destroyObjectAsync(glObject: WebGLObject): Promise<void>;
}
export {};
