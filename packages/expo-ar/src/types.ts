import {
  AnchorType,
  BlendShape,
  DepthDataQuality,
  DepthDataAccuracy,
  FrameAttribute,
} from './enums';

export type Size = {
  width: number;
  height: number;
};

export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

export type Vector2 = {
  x: number;
  y: number;
};

export type TextureCoordinate = {
  u: number;
  v: number;
};

export type Matrix = number[];

export type FaceGeometry = {
  vertexCount: number;
  textureCoordinateCount: number;
  triangleCount: number;
  vertices: Vector3[];
  textureCoordinates: TextureCoordinate[];
  triangleIndices: number[];
};

export type Anchor = {
  type: AnchorType;
  transform: Matrix;
  id: string;
  center?: Vector3;
  extent?: { width: number; length: number };
  image?: {
    name: string | null;
    size: Size;
  };
  geometry?: FaceGeometry;
  blendShapes?: { [shape in BlendShape]?: number };
};

export type HitTest = {
  type: number;
  distance: number;
  localTransform: number[];
  worldTransform: number[];
  anchor: Anchor;
};

export type DetectionImage = {
  uri: string;
  width: number;
  name?: string;
};

export type ARFrameAnchorRequest = {
  ARFaceTrackingConfiguration?: {
    geometry?: boolean;
    blendShapes?: boolean | BlendShape[];
  };
};

export type ARFrameRequest = {
  [FrameAttribute.Anchors]?: ARFrameAnchorRequest;
  [FrameAttribute.RawFeaturePoints]?: boolean;
  [FrameAttribute.LightEstimation]?: boolean;
  [FrameAttribute.CapturedDepthData]?: boolean;
};

export type LightEstimation = {
  ambientIntensity: number;
  ambientColorTemperature: number;
  primaryLightDirection?: Vector3;
  primaryLightIntensity?: number;
};

export type RawFeaturePoint = {
  x: number;
  y: number;
  z: number;
  id: string;
};

export type CameraCalibrationData = {
  intrinsicMatrix: Matrix,
  intrinsicMatrixReferenceDimensions: Size,
  extrinsicMatrix: Matrix,
  pixelSize: number,
  lensDistortionLookupTable: any,
  inverseLensDistortionLookupTable: any,
  lensDistortionCenter: Vector3,
};

export type CapturedDepthData = {
  timestamp: number,
  depthDataQuality: DepthDataQuality,
  depthDataAccuracy: DepthDataAccuracy,
  depthDataFiltered: boolean,
  cameraCalibrationData: CameraCalibrationData,
};

export type ARFrame = {
  timestamp: number;
  [FrameAttribute.Anchors]?: Anchor[] | null;
  [FrameAttribute.RawFeaturePoints]?: RawFeaturePoint[] | null;
  [FrameAttribute.LightEstimation]?: LightEstimation | null;
  [FrameAttribute.CapturedDepthData]?: CapturedDepthData | null;
};

export type ARMatrices = {
  transform: Matrix,
  viewMatrix: Matrix,
  projectionMatrix: Matrix,
};

export type ImageResolution = {
  width: number,
  height: number,
};

export type VideoFormat = {
  type: string,
  imageResolution: ImageResolution,
  framesPerSecond: number,
};
