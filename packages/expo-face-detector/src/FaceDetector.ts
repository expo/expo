import { UnavailabilityError } from 'expo-errors';

import ExpoFaceDetector from './ExpoFaceDetector';

export type Point = { x: number; y: number };

export type FaceFeature = {
  bounds: {
    size: {
      width: number;
      height: number;
    };
    origin: Point;
  };
  smilingProbability?: number;
  leftEarPosition?: Point;
  rightEarPosition?: Point;
  leftEyePosition?: Point;
  leftEyeOpenProbability?: number;
  rightEyePosition?: Point;
  rightEyeOpenProbability?: number;
  leftCheekPosition?: Point;
  rightCheekPosition?: Point;
  leftMouthPosition?: Point;
  mouthPosition?: Point;
  rightMouthPosition?: Point;
  bottomMouthPosition?: Point;
  noseBasePosition?: Point;
  yawAngle?: number;
  rollAngle?: number;
};

export type ValuesOf<T extends any[]> = T[number];

export type FaceDetectorMode = ValuesOf<typeof ExpoFaceDetector.Mode>;

export type FaceDetectorLandmarks = ValuesOf<typeof ExpoFaceDetector.Landmarks>;

export type FaceDetectorClassifications = ValuesOf<typeof ExpoFaceDetector.Classifications>;

export type DetectionOptions = {
  mode?: FaceDetectorMode;
  detectLandmarks?: FaceDetectorLandmarks;
  runClassifications?: FaceDetectorClassifications;
};

export async function detectFacesAsync(
  uri: string,
  options: DetectionOptions = {}
): Promise<FaceFeature[]> {
  if (!ExpoFaceDetector.detectFaces) {
    throw new UnavailabilityError('expo-face-detector', 'detectFaces');
  }
  return await ExpoFaceDetector.detectFaces({ ...options, uri });
}

export const Constants = {
  Mode: ExpoFaceDetector.Mode,
  Landmarks: ExpoFaceDetector.Landmarks,
  Classifications: ExpoFaceDetector.Classifications,
};
