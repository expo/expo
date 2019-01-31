import { PictureOptions } from './../Camera.types';
import { CameraType, ImageSize, ImageType } from './CameraModule.types';
export declare function getImageSize(videoWidth: number, videoHeight: number, scale: number): ImageSize;
export declare function toDataURL(canvas: HTMLCanvasElement, imageType: ImageType, quality: number): string;
export declare function hasValidConstraints(preferredCameraType?: CameraType, width?: number | ConstrainLongRange, height?: number | ConstrainLongRange): boolean;
export declare function captureImage(video: HTMLVideoElement, pictureOptions: PictureOptions): string;
export declare function getIdealConstraints(preferredCameraType: CameraType, width?: number | ConstrainLongRange, height?: number | ConstrainLongRange): MediaStreamConstraints;
export declare function getStreamDevice(preferredCameraType: CameraType, preferredWidth?: number | ConstrainLongRange, preferredHeight?: number | ConstrainLongRange): Promise<MediaStream>;
