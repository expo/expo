import React from 'react';
import { CapturedPicture, NativePropsType, PictureOptions } from './Camera.types';
import CameraModule from './CameraModule/CameraModule';
export default class ExponentCamera extends React.Component<NativePropsType> {
    video?: number | null;
    camera: CameraModule | null;
    state: {
        type: null;
    };
    componentWillReceiveProps(nextProps: any): void;
    _updateCameraProps: ({ type, zoom, pictureSize, flashMode, autoFocus, whiteBalance, }: {
        type: any;
        zoom: any;
        pictureSize: any;
        flashMode: any;
        autoFocus: any;
        whiteBalance: any;
    }) => Promise<void>;
    getCamera: () => CameraModule;
    getAvailablePictureSizes: (ratio: string) => Promise<string[]>;
    takePicture: (options: PictureOptions) => Promise<CapturedPicture>;
    resumePreview: () => Promise<void>;
    pausePreview: () => void;
    onCameraReady: () => void;
    onMountError: (error: any) => void;
    _setRef: (ref: any) => Promise<void>;
    render(): JSX.Element;
}
