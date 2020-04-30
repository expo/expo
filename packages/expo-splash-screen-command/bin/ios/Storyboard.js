"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const constants_1 = require("../constants");
const file_helpers_1 = require("../file-helpers");
const xcode_1 = require("../xcode");
const STORYBOARD_FILE_PATH = './SplashScreen.storyboard';
/**
 * Modifies `.pbxproj` by:
 * - adding reference for `.storyboard` file
 */
function updatePbxProject({ projectName, pbxProject, applicationNativeTarget }) {
    // Check if `${projectName}/SplashScreen.storyboard` already exists
    // Path relative to `ios` directory
    const storyboardFilePath = path_1.default.join(projectName, STORYBOARD_FILE_PATH);
    if (!pbxProject.hasFile(storyboardFilePath)) {
        const group = pbxProject.findPBXGroupKey({ name: projectName });
        if (!group) {
            throw new Error(`Couldn't locate proper PBXGroup '.xcodeproj' file.`);
        }
        xcode_1.addStoryboardFileToProject(pbxProject, storyboardFilePath, {
            target: applicationNativeTarget.uuid,
            group,
        });
    }
}
/**
 * Creates [STORYBOARD] file containing ui description of Splash/Launch Screen.
 * > WARNING: modifies `pbxproj`
 */
async function configureStoryboard(iosProject, { resizeMode, backgroundColor, splashScreenImagePresent, }) {
    let contentMode;
    switch (resizeMode) {
        case constants_1.ResizeMode.CONTAIN:
            contentMode = 'scaleAspectFit';
            break;
        case constants_1.ResizeMode.COVER:
            contentMode = 'scaleAspectFill';
            break;
        default:
            throw new Error(`resizeMode = ${resizeMode} is not supported for iOS platform.`);
    }
    const [r, g, b, a] = backgroundColor.value;
    const red = r / 255;
    const green = g / 255;
    const blue = b / 255;
    const alpha = a;
    const filePath = path_1.default.resolve(iosProject.projectPath, STORYBOARD_FILE_PATH);
    await file_helpers_1.createDirAndWriteFile(filePath, `<?xml version="1.0" encoding="UTF-8"?>
<document
  type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB"
  version="3.0"
  toolsVersion="15705"
  targetRuntime="iOS.CocoaTouch"
  propertyAccessControl="none"
  useAutolayout="YES"
  launchScreen="YES"
  useTraitCollections="YES"
  useSafeAreas="YES"
  colorMatched="YES"
  initialViewController="EXPO-VIEWCONTROLLER-1"
>
  <device id="retina6_1" orientation="portrait" appearance="light"/>
  <dependencies>
    <deployment identifier="iOS"/>
    <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="15706"/>
    <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>
  </dependencies>
  <scenes>
    <!--View Controller-->
    <scene sceneID="EXPO-SCENE-1">
      <objects>
        <viewController
          storyboardIdentifier="SplashScreenViewController"
          id="EXPO-VIEWCONTROLLER-1"
          sceneMemberID="viewController"
        >
          <imageView
            key="view"
            clipsSubviews="YES"
            userInteractionEnabled="NO"
            contentMode="${contentMode}"
            horizontalHuggingPriority="251"
            verticalHuggingPriority="251"${splashScreenImagePresent ? '\n            image="SplashScreen"' : ''}
            id="EXPO-IMAGEVIEW-1"
          >
            <rect key="frame" x="0.0" y="0.0" width="800" height="1600"/>
            <autoresizingMask key="autoresizingMask" flexibleMaxX="YES" flexibleMaxY="YES"/>
            <color key="backgroundColor" red="${red}" green="${green}" blue="${blue}" alpha="${alpha}" colorSpace="custom" customColorSpace="sRGB"/>
          </imageView>
          <size key="freeformSize" width="800" height="1600"/>
        </viewController>
        <placeholder placeholderIdentifier="IBFirstResponder" id="EXPO-PLACEHOLDER-1" userLabel="First Responder" sceneMemberID="firstResponder"/>
      </objects>
      <point key="canvasLocation" x="141" y="130"/>
    </scene>
  </scenes>
  <resources>
    <image name="SplashScreen" width="600" height="1200"/>
  </resources>
</document>
`);
    await updatePbxProject(iosProject);
}
exports.default = configureStoryboard;
//# sourceMappingURL=Storyboard.js.map