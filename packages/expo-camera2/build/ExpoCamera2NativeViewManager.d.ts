import { FocusPoint, Picture, TakingPictureOptions, Video, VideoRecordingOptions } from './ExpoCamera2.types';
declare type NodeHandle = number | undefined;
declare const ExpoCamera2NativeViewManager: {
    pausePreviewAsync: (cameraViewNodeHandle: NodeHandle) => Promise<void>;
    resumePreviewAsync: (cameraViewNodeHandle: NodeHandle) => Promise<void>;
    focusOnPoint: (previewFocusPoint: FocusPoint, cameraViewNodeHandle: NodeHandle) => Promise<boolean>;
    recordAsync: (options: VideoRecordingOptions, cameraViewNodeHandle: NodeHandle) => Promise<Video>;
    takePictureAsync: (options: TakingPictureOptions, cameraViewNodeHandle: NodeHandle) => Promise<Picture>;
    stopRecordingAsync: (cameraViewNodeHandle: NodeHandle) => Promise<void>;
    getAvailablePictureSizesAsync: (ratio: string, cameraViewNodeHandle: NodeHandle) => Promise<string[]>;
    getAvailableRatiosAsync: (cameraViewNodeHandle: NodeHandle) => Promise<string[]>;
    addListener: (eventName: string) => void;
    removeListeners: (count: number) => void;
};
export default ExpoCamera2NativeViewManager;
