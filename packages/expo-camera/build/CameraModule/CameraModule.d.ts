import * as React from 'react';
import { CameraPictureOptions } from '../Camera.types';
import { CameraType, CapturedPicture, CaptureOptions, ImageType } from './CameraModule.types';
export { ImageType, CameraType, CaptureOptions };
declare type OnCameraReadyListener = () => void;
declare type OnMountErrorListener = (event: {
    nativeEvent: Error;
}) => void;
export declare type WebCameraSettings = Partial<{
    autoFocus: string;
    flashMode: string;
    whiteBalance: string;
    exposureCompensation: number;
    colorTemperature: number;
    iso: number;
    brightness: number;
    contrast: number;
    saturation: number;
    sharpness: number;
    focusDistance: number;
    zoom: number;
}>;
export declare function useCameraStream(video: React.MutableRefObject<HTMLVideoElement | null>, type: CameraType, settings: Record<string, any>, { onCameraReady, onMountError, }: {
    onCameraReady?: OnCameraReadyListener;
    onMountError?: OnMountErrorListener;
}): {
    type: CameraType | null;
    resume: () => Promise<MediaStream | null>;
    stop: () => void;
    capture: (config: CameraPictureOptions) => CapturedPicture;
};
