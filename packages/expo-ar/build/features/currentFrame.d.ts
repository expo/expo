import { Anchor, BlendShape, Size, Vector3, Matrix4 } from '../commons';
/**
 * Attributes that are available to be queried from current frame.
 * See {@link getCurrentFrameAsync}
 */
export declare enum FrameAttribute {
    Anchors = "anchors",
    Planes = "planes",
    RawFeaturePoints = "rawFeaturePoints",
    LightEstimation = "lightEstimation",
    CapturedDepthData = "capturedDepthData"
}
export declare type ARFrameAttributes = {
    [FrameAttribute.Anchors]?: {
        ARFaceTrackingConfiguration?: {
            geometry?: boolean;
            blendShapes?: boolean | BlendShape[];
        };
    };
    [FrameAttribute.RawFeaturePoints]?: boolean;
    [FrameAttribute.Planes]?: boolean;
    [FrameAttribute.LightEstimation]?: boolean;
    [FrameAttribute.CapturedDepthData]?: boolean;
};
export declare type RawFeaturePoint = {
    x: number;
    y: number;
    z: number;
    id: string;
};
export declare enum DepthDataQuality {
    Low = "AVDepthDataQualityLow",
    High = "AVDepthDataQualityHigh"
}
export declare enum DepthDataAccuracy {
    Absolute = "AVDepthDataAccuracyAbsolute",
    Relative = "AVDepthDataAccuracyRelative"
}
export declare type CameraCalibrationData = {
    intrinsicMatrix: number[];
    intrinsicMatrixReferenceDimensions: Size;
    extrinsicMatrix: number[];
    pixelSize: number;
    lensDistortionLookupTable: any;
    inverseLensDistortionLookupTable: any;
    lensDistortionCenter: Vector3;
};
export declare type CapturedDepthData = {
    timestamp: number;
    depthDataQuality: DepthDataQuality;
    depthDataAccuracy: DepthDataAccuracy;
    depthDataFiltered: boolean;
    cameraCalibrationData: CameraCalibrationData;
};
export declare enum PlaneType {
    VERTICAL = "vertical",
    HORIZONTAL_UPWARD_FACING = "horizontalUpwardFacing",
    HORIZONTAL_DOWNWARD_FACING = "horizontalDownwardFacing"
}
export declare type Plane = {
    id: number;
    worldTransform: Matrix4;
    extent: {
        width: number;
        length: number;
    };
    center: {
        x: number;
        y: number;
        z: number;
    };
    parent?: Plane;
    planeType: PlaneType;
    anchors?: Anchor[];
};
export declare type LightEstimation = {
    red: number;
    green: number;
    blue: number;
    pixelIntensity?: number;
    ambientIntensity?: number;
    iOS?: LightEstimationIOS;
    android?: LightEstimationAndroid;
};
declare enum LightEstimationAndroidState {
    VALID = "valid",
    INVALID = "invalid"
}
declare type LightEstimationAndroid = {
    red: number;
    green: number;
    blue: number;
    pixelIntensity: number;
    state: LightEstimationAndroidState;
};
declare type LightEstimationIOS = {
    ambientIntensity: number;
    ambientColorTemperature: number;
};
export declare type ARFrame = {
    timestamp: number;
    [FrameAttribute.Anchors]?: Anchor[];
    [FrameAttribute.RawFeaturePoints]?: RawFeaturePoint[];
    [FrameAttribute.Planes]?: Plane[];
    [FrameAttribute.LightEstimation]?: LightEstimation;
    [FrameAttribute.CapturedDepthData]?: CapturedDepthData | null;
};
/**
 * Requests data from current frame.
 * @param attributes Specification which data to query from frame.
 */
export declare function getCurrentFrameAsync(attributes: ARFrameAttributes): Promise<ARFrame>;
export {};
