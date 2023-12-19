import { UnavailabilityError } from 'expo-modules-core';

import ExpoFaceDetector from './ExpoFaceDetector';

declare const global: any;

let warnedAboutDeprecation = false;

// @docsMissing
export type Point = { x: number; y: number };

// @needsAudit
export type FaceFeature = {
  /**
   * An object containing face bounds.
   */
  bounds: FaceFeatureBounds;
  /**
   * Probability that the face is smiling. Returned only if detection classifications property is
   * set to `FaceDetectorClassifications.all`.
   */
  smilingProbability?: number;
  /**
   * Position of the left ear in image coordinates. Returned only if detection classifications
   * property is set to `FaceDetectorLandmarks.all`.
   */
  leftEarPosition?: Point;
  /**
   * Position of the right ear in image coordinates. Returned only if detection classifications
   * property is set to `FaceDetectorLandmarks.all`.
   */
  rightEarPosition?: Point;
  /**
   * Position of the left eye in image coordinates. Returned only if detection classifications
   * property is set to `FaceDetectorLandmarks.all`.
   */
  leftEyePosition?: Point;
  /**
   * Probability that the left eye is open. Returned only if detection classifications property is
   * set to `FaceDetectorClassifications.all`.
   */
  leftEyeOpenProbability?: number;
  /**
   * Position of the right eye in image coordinates. Returned only if detection classifications
   * property is set to `FaceDetectorLandmarks.all`.
   */
  rightEyePosition?: Point;
  /**
   * Probability that the right eye is open. Returned only if detection classifications property is
   * set to `FaceDetectorClassifications.all`.
   */
  rightEyeOpenProbability?: number;
  /**
   * Position of the left cheek in image coordinates. Returned only if detection classifications
   * property is set to `FaceDetectorLandmarks.all`.
   */
  leftCheekPosition?: Point;
  /**
   * Position of the right cheek in image coordinates. Returned only if detection classifications
   * property is set to `FaceDetectorLandmarks.all`.
   */
  rightCheekPosition?: Point;
  /**
   * Position of the left edge of the mouth in image coordinates. Returned only if detection
   * classifications property is set to `FaceDetectorLandmarks.all`.
   */
  leftMouthPosition?: Point;
  /**
   * Position of the center of the mouth in image coordinates. Returned only if detection
   * classifications property is set to `FaceDetectorLandmarks.all`.
   */
  mouthPosition?: Point;
  /**
   * Position of the right edge of the mouth in image coordinates. Returned only if detection
   * classifications property is set to `FaceDetectorLandmarks.all`.
   */
  rightMouthPosition?: Point;
  /**
   * Position of the bottom edge of the mouth in image coordinates. Returned only if detection
   * classifications property is set to `FaceDetectorLandmarks.all`.
   */
  bottomMouthPosition?: Point;
  /**
   * Position of the nose base in image coordinates. Returned only if detection classifications
   * property is set to `FaceDetectorLandmarks.all`.
   */
  noseBasePosition?: Point;
  /**
   * Yaw angle of the face (heading, turning head left or right).
   */
  yawAngle?: number;
  /**
   * Roll angle of the face (bank).
   */
  rollAngle?: number;
  /**
   * A face identifier (used for tracking, if the same face appears on consecutive frames it will
   * have the same `faceID`).
   */
  faceID?: number;
};

// @needsAudit
export type FaceFeatureBounds = {
  /**
   * Size of the square containing the face in image coordinates,
   */
  size: {
    width: number;
    height: number;
  };
  /**
   * Position of the top left corner of a square containing the face in image coordinates,
   */
  origin: Point;
};

// @docsMissing
export enum FaceDetectorMode {
  fast = 1,
  accurate = 2,
}

// @docsMissing
export enum FaceDetectorLandmarks {
  none = 1,
  all = 2,
}

// @docsMissing
export enum FaceDetectorClassifications {
  none = 1,
  all = 2,
}

// @needsAudit
export type Image = {
  /**
   * URI of the image.
   */
  uri: string;
  /**
   * Width of the image in pixels.
   */
  width: number;
  /**
   * Height of the image in pixels.
   */
  height: number;
  /**
   * Orientation of the image (value conforms to the EXIF orientation tag standard).
   */
  orientation: number;
};

// @needsAudit
/**
 * In order to configure detector's behavior modules pass a settings object which is then
 * interpreted by this module.
 */
export type DetectionOptions = {
  /**
   * Whether to detect faces in fast or accurate mode. Use `FaceDetector.FaceDetectorMode.{fast, accurate}`.
   */
  mode?: FaceDetectorMode;
  /**
   * Whether to detect and return landmarks positions on the face (ears, eyes, mouth, cheeks, nose).
   * Use `FaceDetector.FaceDetectorLandmarks.{all, none}`.
   */
  detectLandmarks?: FaceDetectorLandmarks;
  /**
   * Whether to run additional classifications on detected faces (smiling probability, open eye
   * probabilities). Use `FaceDetector.FaceDetectorClassifications.{all, none}`.
   */
  runClassifications?: FaceDetectorClassifications;
  /**
   * Minimal interval in milliseconds between two face detection events being submitted to JS.
   * Use, when you expect lots of faces for long time and are afraid of JS Bridge being overloaded.
   * @default 0
   */
  minDetectionInterval?: number;
  /**
   * Flag to enable tracking of faces between frames. If true, each face will be returned with
   * `faceID` attribute which should be consistent across frames.
   * @default false
   */
  tracking?: boolean;
};

if (!warnedAboutDeprecation) {
  console.warn(
    'ExpoFaceDetector has been deprecated and will be removed in a future SDK version. We recommend using react-native-vision-camera for this functionality. See https://github.com/mrousavy/react-native-vision-camera'
  );
  warnedAboutDeprecation = true;
}

// @needsAudit
export type DetectionResult = {
  /**
   * Array of faces objects.
   */
  faces: FaceFeature[];
  // @docsMissing
  image: Image;
};
// @needsAudit
/**
 * Detect faces on a picture.
 * @param uri `file://` URI to the image.
 * @param options A map of detection options.
 * @return Returns a Promise which fulfils with [`DetectionResult`](#detectionresult) object.
 * @deprecated If you require this functionality, we recommend using [react-native-vision-camera](https://github.com/mrousavy/react-native-vision-camera)
 */
export async function detectFacesAsync(
  uri: string,
  options: DetectionOptions = {}
): Promise<DetectionResult> {
  if (!ExpoFaceDetector || !ExpoFaceDetector.detectFaces) {
    if (global.expo?.modules?.ExponentConstants?.appOwnership === 'expo') {
      console.warn(
        [
          "ExpoFaceDetector has been removed from Expo Go. To use this functionality, you'll have to create a development build or prebuild using npx expo run:android|ios commands.",
          'Learn more: https://expo.fyi/face-detector-removed',
          'Learn more about development builds: https://docs.expo.dev/develop/development-builds/create-a-build/',
          'Learn more about prebuild: https://docs.expo.dev/workflow/prebuild/',
        ].join('\n\n')
      );
    }
    throw new UnavailabilityError('expo-face-detector', 'detectFaces');
  }
  return await ExpoFaceDetector.detectFaces({ ...options, uri });
}
