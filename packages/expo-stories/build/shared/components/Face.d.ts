import { FaceFeature } from 'expo-face-detector';
export declare const scaledFace: (scale: number) => ({ faceID, bounds, rollAngle, yawAngle, }: FaceFeature) => JSX.Element;
export declare const scaledLandmarks: (scale: number) => (face: FaceFeature) => JSX.Element;
export declare const face: ({ faceID, bounds, rollAngle, yawAngle, }: FaceFeature) => JSX.Element;
export declare const landmarks: (face: FaceFeature) => JSX.Element;
