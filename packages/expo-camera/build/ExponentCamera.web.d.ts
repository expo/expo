import React from 'react';
import { CapturedPicture, MountError, NativeProps, PictureOptions } from './Camera.types';
import CameraModule from './CameraModule/CameraModule';
export default class ExponentCamera extends React.Component<NativeProps> {
    video?: number | null;
    camera?: CameraModule;
    state: {
        type: null;
    };
    componentWillUnmount(): void;
    componentWillReceiveProps(nextProps: any): void;
    private updateCameraProps;
    getCamera: () => CameraModule;
    getAvailablePictureSizes: (ratio: string) => Promise<string[]>;
    takePicture: (options: PictureOptions) => Promise<CapturedPicture>;
    resumePreview: () => Promise<void>;
    pausePreview: () => void;
    onCameraReady: () => void;
    onMountError: ({ nativeEvent }: {
        nativeEvent: MountError;
    }) => void;
    private setRef;
    private updateScanner;
    canvas?: HTMLCanvasElement;
    private setCanvasRef;
    private updateCameraCanvas;
    private shouldRenderIndicator;
    render(): JSX.Element;
}
