import { colorTemperature2rgb } from 'color-temperature';
import { NativeAR } from '../NativeAR';
import {
  Anchor,
  BlendShape,
  Size,
  Vector3,
  Matrix4,
} from '../commons';

/**
 * Attributes that are available to be queried from current frame.
 * See {@link getCurrentFrameAsync}
 */
export enum FrameAttribute {
  Anchors = 'anchors',
  Planes = 'planes',
  RawFeaturePoints = 'rawFeaturePoints',
  LightEstimation = 'lightEstimation',
  CapturedDepthData = 'capturedDepthData',
}

export type ARFrameAttributes = {
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

export type RawFeaturePoint = {
  x: number;
  y: number;
  z: number;
  id: string;
};

export enum DepthDataQuality {
  Low = 'AVDepthDataQualityLow',
  High = 'AVDepthDataQualityHigh',
}

export enum DepthDataAccuracy {
  Absolute = 'AVDepthDataAccuracyAbsolute',
  Relative = 'AVDepthDataAccuracyRelative',
}

export type CameraCalibrationData = {
  intrinsicMatrix: number[];
  intrinsicMatrixReferenceDimensions: Size;
  extrinsicMatrix: number[];
  pixelSize: number;
  lensDistortionLookupTable: any;
  inverseLensDistortionLookupTable: any;
  lensDistortionCenter: Vector3;
};

export type CapturedDepthData = {
  timestamp: number;
  depthDataQuality: DepthDataQuality;
  depthDataAccuracy: DepthDataAccuracy;
  depthDataFiltered: boolean;
  cameraCalibrationData: CameraCalibrationData;
};

export enum PlaneType {
  VERTICAL = 'vertical',
  HORIZONTAL_UPWARD_FACING = 'horizontalUpwardFacing',
  HORIZONTAL_DOWNWARD_FACING = 'horizontalDownwardFacing'
};

export type Plane = {
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

export type LightEstimation = {
  red: number;
  green: number;
  blue: number;
  
  // @only Android: value is between (0.0, 1.0), with zero being black and one being white.
  pixelIntensity?: number;
  
  // @only iOS: ambient intensity, in lumens, of ambient light throughout the scene. A value of 1000 represents "neutral" lighting.
  // see: https://en.wikipedia.org/wiki/Shading#Ambient_lighting
  ambientIntensity?: number;

  iOS?: LightEstimationIOS;
  android?: LightEstimationAndroid;
};

enum LightEstimationAndroidState {
  VALID = 'valid',
  INVALID = 'invalid'
}

type LightEstimationAndroid = {
  red: number;
  green: number;
  blue: number;
  pixelIntensity: number; // see LightEstimation.pixelIntensity
  state: LightEstimationAndroidState;
}

type LightEstimationIOS = {
  ambientIntensity: number; // see LightEstimation.ambientIntensity
  
  // The estimated color temperature, in degrees Kelvin
  // A value of 6500 represents neutral (pure white) lighting; lower values indicate a "warmer" yellow or orange tint, and higher values indicate a "cooler" blue tint.
  ambientColorTemperature: number;
}

function isLightEstimationIOS(lightEstimation: LightEstimationAndroid | LightEstimationIOS): lightEstimation is LightEstimationIOS {
  return !!(lightEstimation as LightEstimationIOS).ambientIntensity;
}

function isLightEstimationAndroid(lightEstimation: LightEstimationAndroid | LightEstimationIOS): lightEstimation is LightEstimationAndroid {
  return !!(lightEstimation as LightEstimationAndroid).pixelIntensity;
}

function handleLightEstimationInconsistencies(lightEstimation: LightEstimationAndroid | LightEstimationIOS): LightEstimation {
  if (isLightEstimationIOS(lightEstimation)) {
    const { ambientColorTemperature, ambientIntensity } = lightEstimation;
    const { red, green, blue } = colorTemperature2rgb(ambientColorTemperature);
    return {
      red,
      green,
      blue,
      ambientIntensity,
      iOS: lightEstimation,
    };
  }
  if (isLightEstimationAndroid(lightEstimation)) {
    return {
      ...lightEstimation,
      android: lightEstimation,
    };
  }
  throw new Error(`getCurrentFrameAsync#LightEstimation returned unknown results: ${JSON.stringify(lightEstimation)}`);
}

export type ARFrame = {
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
export async function getCurrentFrameAsync(attributes: ARFrameAttributes): Promise<ARFrame> {
  const frame = await NativeAR.getCurrentFrameAsync(attributes);
  if (attributes[FrameAttribute.LightEstimation]) {
    frame.lightEstimation = handleLightEstimationInconsistencies(frame.lightEstimation);
  }
  return frame;
}
