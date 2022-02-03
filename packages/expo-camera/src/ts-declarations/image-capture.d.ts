// Type definitions for non-npm package W3C Image Capture 1.0
// Project: https://www.w3.org/TR/image-capture/
// Definitions by: Cosium <https://github.com/cosium>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 3.0

declare module 'image-capture';

declare class ImageCapture {
  constructor(videoTrack: MediaStreamTrack);

  takePhoto(photoSettings?: PhotoSettings): Promise<Blob>;

  getPhotoCapabilities(): Promise<PhotoCapabilities>;

  getPhotoSettings(): Promise<PhotoSettings>;

  grabFrame(): Promise<ImageBitmap>;

  readonly track: MediaStreamTrack;
}

interface PhotoCapabilities {
  readonly redEyeReduction: RedEyeReduction;
  readonly imageHeight: MediaSettingsRange;
  readonly imageWidth: MediaSettingsRange;
  readonly fillLightMode: FillLightMode[];
}

interface PhotoSettings {
  fillLightMode?: FillLightMode;
  imageHeight?: number;
  imageWidth?: number;
  redEyeReduction?: boolean;
}

interface MediaSettingsRange {
  readonly max: number;
  readonly min: number;
  readonly step: number;
}

type RedEyeReduction = 'never' | 'always' | 'controllable';
type FillLightMode = 'auto' | 'off' | 'flash';

interface MediaTrackCapabilities {
  whiteBalanceMode: MeteringMode[];
  exposureMode: MeteringMode[];
  focusMode: MeteringMode[];

  exposureCompensation: MediaSettingsRange;
  colorTemperature: MediaSettingsRange;
  iso: MediaSettingsRange;
  brightness: MediaSettingsRange;
  contrast: MediaSettingsRange;
  saturation: MediaSettingsRange;
  sharpness: MediaSettingsRange;

  focusDistance: MediaSettingsRange;
  zoom: MediaSettingsRange;
  torch: boolean;
}

declare namespace W3C {
  type ConstrainPoint2D = Point2D[] | ConstrainPoint2DParameters;
}

interface MediaTrackConstraintSet {
  whiteBalanceMode?: W3C.ConstrainString;
  exposureMode?: W3C.ConstrainString;
  focusMode?: W3C.ConstrainString;
  pointsOfInterest?: W3C.ConstrainPoint2D;

  exposureCompensation?: W3C.ConstrainDouble;
  colorTemperature?: W3C.ConstrainDouble;
  iso?: W3C.ConstrainDouble;

  brightness?: W3C.ConstrainDouble;
  contrast?: W3C.ConstrainDouble;
  saturation?: W3C.ConstrainDouble;
  sharpness?: W3C.ConstrainDouble;

  focusDistance?: W3C.ConstrainDouble;
  zoom?: W3C.ConstrainDouble;

  torch?: W3C.ConstrainBoolean;
}

interface MediaTrackSettings {
  whiteBalanceMode: MeteringMode;
  exposureMode: MeteringMode;
  focusMode: MeteringMode;
  pointsOfInterest: Point2D[];

  exposureCompensation: number;
  colorTemperature: number;
  iso: number;

  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;

  focusDistance: number;
  zoom: number;

  torch: boolean;
}

interface MediaTrackSupportedConstraints {
  whiteBalanceMode: boolean;
  exposureMode: boolean;
  focusMode: boolean;
  pointsOfInterest: boolean;

  exposureCompensation: boolean;
  colorTemperature: boolean;
  iso: boolean;

  brightness: boolean;
  contrast: boolean;
  saturation: boolean;
  sharpness: boolean;
  focusDistance: boolean;
  zoom: boolean;
  torch: boolean;
}

interface ConstrainPoint2DParameters {
  exact: Point2D[];
  ideal: Point2D[];
}

type MeteringMode = 'none' | 'manual' | 'single-shot' | 'continuous';

interface Point2D {
  x: number;
  y: number;
}
