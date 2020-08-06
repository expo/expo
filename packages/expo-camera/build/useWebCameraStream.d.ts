import * as React from 'react';
import { CameraType, CapturedPicture, CameraPictureOptions, CameraReadyListener, MountErrorListener } from './Camera.types';
export declare function useWebCameraStream(video: React.MutableRefObject<HTMLVideoElement | null>, preferredType: CameraType, settings: Record<string, any>, { onCameraReady, onMountError, }: {
    onCameraReady?: CameraReadyListener;
    onMountError?: MountErrorListener;
}): {
    type: CameraType | null;
    resumeAsync: () => Promise<void>;
    stopAsync: () => void;
    captureAsync: (config: CameraPictureOptions) => CapturedPicture;
};
