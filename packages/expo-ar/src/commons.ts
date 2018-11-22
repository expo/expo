export type Vector2 = {
  x: number;
  y: number;
};

export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

export type Size = {
  width: number;
  height: number;
};

export type Matrix4x4 = [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number
];

export enum AnchorType {
  Face = 'ARFaceAnchor',
  Image = 'ARImageAnchor',
  Plane = 'ARPlaneAnchor',
  Anchor = 'ARAnchor',
}

type TextureCoordinate = {
  u: number;
  v: number;
};

type FaceGeometry = {
  vertexCount: number;
  textureCoordinateCount: number;
  triangleCount: number;
  vertices: Vector3[];
  textureCoordinates: TextureCoordinate[];
  triangleIndices: number[];
};

export enum BlendShape {
  BrowDownL = 'browDown_L',
  BrowDownR = 'browDown_R',
  BrowInnerUp = 'browInnerUp',
  BrowOuterUpL = 'browOuterUp_L',
  BrowOuterUpR = 'browOuterUp_R',
  CheekPuff = 'cheekPuff',
  CheekSquintL = 'cheekSquint_L',
  CheekSquintR = 'cheekSquint_R',
  EyeBlinkL = 'eyeBlink_L',
  EyeBlinkR = 'eyeBlink_R',
  EyeLookDownL = 'eyeLookDown_L',
  EyeLookDownR = 'eyeLookDown_R',
  EyeLookInL = 'eyeLookIn_L',
  EyeLookInR = 'eyeLookIn_R',
  EyeLookOutL = 'eyeLookOut_L',
  EyeLookOutR = 'eyeLookOut_R',
  EyeLookUpL = 'eyeLookUp_L',
  EyeLookUpR = 'eyeLookUp_R',
  EyeSquintL = 'eyeSquint_L',
  EyeSquintR = 'eyeSquint_R',
  EyeWideL = 'eyeWide_L',
  EyeWideR = 'eyeWide_R',
  JawForward = 'jawForward',
  JawLeft = 'jawLeft',
  JawOpen = 'jawOpen',
  JawRight = 'jawRight',
  MouthClose = 'mouthClose',
  MouthDimpleL = 'mouthDimple_L',
  MouthDimpleR = 'mouthDimple_R',
  MouthFrownL = 'mouthFrown_L',
  MouthFrownR = 'mouthFrown_R',
  MouthFunnel = 'mouthFunnel',
  MouthLeft = 'mouthLeft',
  MouthLowerDownL = 'mouthLowerDown_L',
  MouthLowerDownR = 'mouthLowerDown_R',
  MouthPressL = 'mouthPress_L',
  MouthPressR = 'mouthPress_R',
  MouthPucker = 'mouthPucker',
  MouthRight = 'mouthRight',
  MouthRollLower = 'mouthRollLower',
  MouthRollUpper = 'mouthRollUpper',
  MouthShrugLower = 'mouthShrugLower',
  MouthShrugUpper = 'mouthShrugUpper',
  MouthSmileL = 'mouthSmile_L',
  MouthSmileR = 'mouthSmile_R',
  MouthStretchL = 'mouthStretch_L',
  MouthStretchR = 'mouthStretch_R',
  MouthUpperUpL = 'mouthUpperUp_L',
  MouthUpperUpR = 'mouthUpperUp_R',
  NoseSneerL = 'noseSneer_L',
  NoseSneerR = 'noseSneer_R',
}

export type Anchor = {
  type: AnchorType;
  transformWorld: Matrix4x4;
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

/**
 * @only iOS
 * 
 * Options for how ARKit constructs a scene coordinate system based on real-world device motion.
 * {@link https://developer.apple.com/documentation/arkit/arconfiguration}
 */
export enum TrackingConfiguration {
  /**
   * Provides high-quality AR experiences that use the rear-facing camera precisely track a device's
   * position and orientation and allow plane detection and hit testing.
   */
  World = 'ARWorldTrackingConfiguration',

  /**
   * Provides basic AR experiences that use the rear-facing camera and track only a device's
   * orientation.
   */
  Orientation = 'AROrientationTrackingConfiguration',

  /**
   * Provides AR experiences that use the front-facing camera and track the movement and expressions
   * of the user's face.
   */
  Face = 'ARFaceTrackingConfiguration',
}
