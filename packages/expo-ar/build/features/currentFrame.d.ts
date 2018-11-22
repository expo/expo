import { Anchor, BlendShape, Size, Vector3, Matrix4x4 } from '../commons';
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
declare type ARFrameAttributes = {
    [FrameAttribute.Anchors]?: {
        ARFaceTrackingConfiguration?: {
            geometry?: boolean;
            blendShapes?: boolean | BlendShape[];
        };
    };
    [FrameAttribute.RawFeaturePoints]?: boolean;
    [FrameAttribute.LightEstimation]?: boolean;
    [FrameAttribute.CapturedDepthData]?: boolean;
};
declare type RawFeaturePoint = {
    x: number;
    y: number;
    z: number;
    id: string;
};
declare type LightEstimation = {
    ambientIntensity: number;
    ambientColorTemperature: number;
    primaryLightDirection?: Vector3;
    primaryLightIntensity?: number;
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
declare type CapturedDepthData = {
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
declare type Plane = {
    id: number;
    transformWorld: Matrix4x4;
    extend: {
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
declare type ARFrame = {
    timestamp: number;
    [FrameAttribute.Anchors]?: Anchor[] | null;
    [FrameAttribute.RawFeaturePoints]?: RawFeaturePoint[] | null;
    [FrameAttribute.Planes]?: Plane[] | null;
    [FrameAttribute.LightEstimation]?: LightEstimation | null;
    [FrameAttribute.CapturedDepthData]?: CapturedDepthData | null;
};
/**
 * Requests data from current frame.
 * @param attributes Specification which data to query from frame.
 */
export declare function getCurrentFrameAsync(attributes: ARFrameAttributes): Promise<ARFrame>;
export {};
