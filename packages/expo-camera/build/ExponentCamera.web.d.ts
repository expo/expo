import React from 'react';
import { CapturedPicture, NativePropsType, PictureOptions, MountError } from './Camera.types';
import CameraModule from './CameraModule/CameraModule';
export default class ExponentCamera extends React.Component<NativePropsType> {
    video?: number | null;
    camera?: CameraModule;
    state: {
        type: null;
    };
    componentWillReceiveProps(nextProps: any): void;
    _updateCameraProps: ({ type, zoom, pictureSize, flashMode, autoFocus, whiteBalance, }: NativePropsType) => Promise<void>;
    getCamera: () => CameraModule;
    getAvailablePictureSizes: (ratio: string) => Promise<string[]>;
    takePicture: (options: PictureOptions) => Promise<CapturedPicture>;
    resumePreview: () => Promise<void>;
    pausePreview: () => void;
    onCameraReady: () => void;
    onMountError: ({ nativeEvent }: {
        nativeEvent: MountError;
    }) => void;
    _setRef: (ref: any) => Promise<void>;
    render(): JSX.Element;
}
