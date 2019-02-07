import ExpoFaceDetector from './ExpoFaceDetector';
declare type Point = {
    x: number;
    y: number;
};
export declare type FaceFeature = {
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
declare type ValuesOf<T extends any[]> = T[number];
export declare type FaceDetectorMode = string[];
export declare type FaceDetectorLandmarks = ValuesOf<typeof ExpoFaceDetector.Landmarks>;
export declare type FaceDetectorClassifications = ValuesOf<typeof ExpoFaceDetector.Classifications>;
export declare type DetectionOptions = {
    mode?: FaceDetectorMode;
    detectLandmarks?: FaceDetectorLandmarks;
    runClassifications?: FaceDetectorClassifications;
};
export declare function detectFacesAsync(uri: string, options?: DetectionOptions): Promise<FaceFeature[]>;
export declare const Constants: {
    Mode: any;
    Landmarks: any;
    Classifications: any;
};
export {};
