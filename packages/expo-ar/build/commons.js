export var AnchorType;
(function (AnchorType) {
    AnchorType["Face"] = "ARFaceAnchor";
    AnchorType["Image"] = "ARImageAnchor";
    AnchorType["Plane"] = "ARPlaneAnchor";
    AnchorType["Anchor"] = "ARAnchor";
})(AnchorType || (AnchorType = {}));
export var BlendShape;
(function (BlendShape) {
    BlendShape["BrowDownL"] = "browDown_L";
    BlendShape["BrowDownR"] = "browDown_R";
    BlendShape["BrowInnerUp"] = "browInnerUp";
    BlendShape["BrowOuterUpL"] = "browOuterUp_L";
    BlendShape["BrowOuterUpR"] = "browOuterUp_R";
    BlendShape["CheekPuff"] = "cheekPuff";
    BlendShape["CheekSquintL"] = "cheekSquint_L";
    BlendShape["CheekSquintR"] = "cheekSquint_R";
    BlendShape["EyeBlinkL"] = "eyeBlink_L";
    BlendShape["EyeBlinkR"] = "eyeBlink_R";
    BlendShape["EyeLookDownL"] = "eyeLookDown_L";
    BlendShape["EyeLookDownR"] = "eyeLookDown_R";
    BlendShape["EyeLookInL"] = "eyeLookIn_L";
    BlendShape["EyeLookInR"] = "eyeLookIn_R";
    BlendShape["EyeLookOutL"] = "eyeLookOut_L";
    BlendShape["EyeLookOutR"] = "eyeLookOut_R";
    BlendShape["EyeLookUpL"] = "eyeLookUp_L";
    BlendShape["EyeLookUpR"] = "eyeLookUp_R";
    BlendShape["EyeSquintL"] = "eyeSquint_L";
    BlendShape["EyeSquintR"] = "eyeSquint_R";
    BlendShape["EyeWideL"] = "eyeWide_L";
    BlendShape["EyeWideR"] = "eyeWide_R";
    BlendShape["JawForward"] = "jawForward";
    BlendShape["JawLeft"] = "jawLeft";
    BlendShape["JawOpen"] = "jawOpen";
    BlendShape["JawRight"] = "jawRight";
    BlendShape["MouthClose"] = "mouthClose";
    BlendShape["MouthDimpleL"] = "mouthDimple_L";
    BlendShape["MouthDimpleR"] = "mouthDimple_R";
    BlendShape["MouthFrownL"] = "mouthFrown_L";
    BlendShape["MouthFrownR"] = "mouthFrown_R";
    BlendShape["MouthFunnel"] = "mouthFunnel";
    BlendShape["MouthLeft"] = "mouthLeft";
    BlendShape["MouthLowerDownL"] = "mouthLowerDown_L";
    BlendShape["MouthLowerDownR"] = "mouthLowerDown_R";
    BlendShape["MouthPressL"] = "mouthPress_L";
    BlendShape["MouthPressR"] = "mouthPress_R";
    BlendShape["MouthPucker"] = "mouthPucker";
    BlendShape["MouthRight"] = "mouthRight";
    BlendShape["MouthRollLower"] = "mouthRollLower";
    BlendShape["MouthRollUpper"] = "mouthRollUpper";
    BlendShape["MouthShrugLower"] = "mouthShrugLower";
    BlendShape["MouthShrugUpper"] = "mouthShrugUpper";
    BlendShape["MouthSmileL"] = "mouthSmile_L";
    BlendShape["MouthSmileR"] = "mouthSmile_R";
    BlendShape["MouthStretchL"] = "mouthStretch_L";
    BlendShape["MouthStretchR"] = "mouthStretch_R";
    BlendShape["MouthUpperUpL"] = "mouthUpperUp_L";
    BlendShape["MouthUpperUpR"] = "mouthUpperUp_R";
    BlendShape["NoseSneerL"] = "noseSneer_L";
    BlendShape["NoseSneerR"] = "noseSneer_R";
})(BlendShape || (BlendShape = {}));
/**
 * @only iOS
 *
 * Options for how ARKit constructs a scene coordinate system based on real-world device motion.
 * {@link https://developer.apple.com/documentation/arkit/arconfiguration}
 */
export var TrackingConfiguration;
(function (TrackingConfiguration) {
    /**
     * Provides high-quality AR experiences that use the rear-facing camera precisely track a device's
     * position and orientation and allow plane detection and hit testing.
     */
    TrackingConfiguration["World"] = "ARWorldTrackingConfiguration";
    /**
     * Provides basic AR experiences that use the rear-facing camera and track only a device's
     * orientation.
     */
    TrackingConfiguration["Orientation"] = "AROrientationTrackingConfiguration";
    /**
     * Provides AR experiences that use the front-facing camera and track the movement and expressions
     * of the user's face.
     */
    TrackingConfiguration["Face"] = "ARFaceTrackingConfiguration";
})(TrackingConfiguration || (TrackingConfiguration = {}));
//# sourceMappingURL=commons.js.map