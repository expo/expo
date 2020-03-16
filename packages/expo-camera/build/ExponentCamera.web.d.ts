import React from 'react';
import { CameraCapturedPicture, CameraMountError, CameraNativeProps, CameraPictureOptions } from './Camera.types';
import CameraModule from './CameraModule/CameraModule';
export default class ExponentCamera extends React.Component<CameraNativeProps> {
    video?: number | null;
    camera?: CameraModule;
    state: {
        type: null;
    };
    componentWillUnmount(): void;
    componentDidUpdate(nextProps: any): void;
    _updateCameraProps: ({ type, pictureSize, ...webCameraSettings }: CameraNativeProps) => Promise<void>;
    getCamera: () => CameraModule;
    getAvailablePictureSizes: (ratio: string) => Promise<string[]>;
    takePicture: (options: CameraPictureOptions) => Promise<CameraCapturedPicture>;
    getAvailableCameraTypesAsync: () => Promise<string[]>;
    resumePreview: () => Promise<void>;
    pausePreview: () => Promise<void>;
    onCameraReady: () => void;
    onMountError: ({ nativeEvent }: {
        nativeEvent: CameraMountError;
    }) => void;
    _setRef: (ref: any) => void;
    render(): JSX.Element;
}
