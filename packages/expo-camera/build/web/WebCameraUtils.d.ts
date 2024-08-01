import { CameraType, CameraCapturedPicture, ImageSize, ImageType, WebCameraSettings, CameraPictureOptions } from '../legacy/Camera.types';
interface ConstrainLongRange {
    max?: number;
    min?: number;
    exact?: number;
    ideal?: number;
}
export declare function getImageSize(videoWidth: number, videoHeight: number, scale: number): ImageSize;
export declare function toDataURL(canvas: HTMLCanvasElement, imageType: ImageType, quality: number): string;
export declare function hasValidConstraints(preferredCameraType?: CameraType, width?: number | ConstrainLongRange, height?: number | ConstrainLongRange): boolean;
export declare function captureImageData(video: HTMLVideoElement | null, pictureOptions?: Pick<CameraPictureOptions, 'scale' | 'isImageMirror'>): ImageData | null;
export declare function captureImageContext(video: HTMLVideoElement, { scale, isImageMirror }: Pick<CameraPictureOptions, 'scale' | 'isImageMirror'>): HTMLCanvasElement;
export declare function captureImage(video: HTMLVideoElement, pictureOptions: CameraPictureOptions): string;
export declare function getIdealConstraints(preferredCameraType: CameraType, width?: number | ConstrainLongRange, height?: number | ConstrainLongRange): MediaStreamConstraints;
/**
 * Invoke getStreamDevice a second time with the opposing camera type if the preferred type cannot be retrieved.
 *
 * @param preferredCameraType
 * @param preferredWidth
 * @param preferredHeight
 */
export declare function getPreferredStreamDevice(preferredCameraType: CameraType, preferredWidth?: number | ConstrainLongRange, preferredHeight?: number | ConstrainLongRange): Promise<MediaStream>;
export declare function getStreamDevice(preferredCameraType: CameraType, preferredWidth?: number | ConstrainLongRange, preferredHeight?: number | ConstrainLongRange): Promise<MediaStream>;
export declare function isWebKit(): boolean;
export declare function compareStreams(a: MediaStream | null, b: MediaStream | null): boolean;
export declare function capture(video: HTMLVideoElement, settings: MediaTrackSettings, config: CameraPictureOptions): CameraCapturedPicture;
export declare function syncTrackCapabilities(cameraType: CameraType, stream: MediaStream | null, settings?: WebCameraSettings): Promise<void>;
export declare function stopMediaStream(stream: MediaStream | null): void;
export declare function setVideoSource(video: HTMLVideoElement, stream: MediaStream | MediaSource | Blob | null): void;
export declare function isCapabilityAvailable(video: HTMLVideoElement, keyName: string): boolean;
export {};
//# sourceMappingURL=WebCameraUtils.d.ts.map