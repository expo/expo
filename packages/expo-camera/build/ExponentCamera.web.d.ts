import React from 'react';
import { CapturedPicture, NativeProps, PictureOptions, MountError } from './Camera.types';
import CameraModule from './CameraModule/CameraModule';
export default class ExponentCamera extends React.Component<NativeProps> {
    video?: number | null;
    camera?: CameraModule;
    state: {
        type: null;
    };
    componentWillUnmount(): void;
    componentWillReceiveProps(nextProps: any): void;
    _updateCameraProps: ({ type, zoom, pictureSize, flashMode, autoFocus, whiteBalance, }: NativeProps) => Promise<void>;
    getCamera: () => CameraModule;
    getAvailablePictureSizes: (ratio: string) => Promise<string[]>;
    takePicture: (options: PictureOptions) => Promise<CapturedPicture>;
    resumePreview: () => Promise<void>;
    pausePreview: () => void;
    onCameraReady: () => void;
    onMountError: ({ nativeEvent }: {
        nativeEvent: MountError;
    }) => void;
    _setRef: (ref: any) => void;
    render(): JSX.Element;
}
