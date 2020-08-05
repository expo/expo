import * as React from 'react';
import { CameraPictureOptions } from '../Camera.types';
import { CameraType, CapturedPicture, CaptureOptions, ImageType } from './CameraModule.types';
export { ImageType, CameraType, CaptureOptions };
declare type OnCameraReadyListener = () => void;
declare type OnMountErrorListener = (event: {
    nativeEvent: Error;
}) => void;
export declare function useCameraStream(video: React.MutableRefObject<HTMLVideoElement | null>, preferredType: CameraType, settings: Record<string, any>, { onCameraReady, onMountError, }: {
    onCameraReady?: OnCameraReadyListener;
    onMountError?: OnMountErrorListener;
}): {
    type: CameraType | null;
    resumeAsync: () => Promise<void>;
    stopAsync: () => void;
    captureAsync: (config: CameraPictureOptions) => CapturedPicture;
};
