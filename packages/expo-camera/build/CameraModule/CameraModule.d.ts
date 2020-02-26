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
declare class CameraModule {
    private videoElement;
    onCameraReady: OnCameraReadyListener;
    onMountError: OnMountErrorListener;
    private stream;
    private settings;
    private pictureSize?;
    private isStartingCamera;
    private cameraType;
    private webCameraSettings;
    get type(): CameraType;
    constructor(videoElement: HTMLVideoElement);
    updateWebCameraSettingsAsync(nextSettings: {
        [key: string]: any;
    }): Promise<boolean>;
    setTypeAsync(value: CameraType): Promise<void>;
    setPictureSize(value: string): void;
    isTorchAvailable(): boolean;
    isZoomAvailable(): boolean;
    private onCapabilitiesReady;
    private applyVideoConstraints;
    private applyAudioConstraints;
    private syncTrackCapabilities;
    private setStream;
    getActualCameraType(): CameraType | null;
    ensureCameraIsRunningAsync(): Promise<void>;
    resumePreview(): Promise<MediaStream | null>;
    takePicture(config: CameraPictureOptions): CapturedPicture;
    stopAsync(): void;
    getAvailablePictureSizes: (ratio: string) => Promise<string[]>;
    getAvailableCameraTypesAsync: () => Promise<string[]>;
}
export default CameraModule;
