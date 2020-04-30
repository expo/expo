import { ColorDescriptor } from 'color-string';
import path from 'path';

import { ResizeMode } from '../constants';
import { createDirAndWriteFile } from '../file-helpers';
import { addStoryboardFileToProject } from '../xcode';
import { IosProject } from './pbxproj';

const STORYBOARD_FILE_PATH = './SplashScreen.storyboard';

/**
 * Modifies `.pbxproj` by:
 * - adding reference for `.storyboard` file
 */
function updatePbxProject({ projectName, pbxProject, applicationNativeTarget }: IosProject): void {
  // Check if `${projectName}/SplashScreen.storyboard` already exists
  // Path relative to `ios` directory
  const storyboardFilePath = path.join(projectName, STORYBOARD_FILE_PATH);
  if (!pbxProject.hasFile(storyboardFilePath)) {
    const group = pbxProject.findPBXGroupKey({ name: projectName });
    if (!group) {
      throw new Error(`Couldn't locate proper PBXGroup '.xcodeproj' file.`);
    }
    addStoryboardFileToProject(pbxProject, storyboardFilePath, {
      target: applicationNativeTarget.uuid,
      group,
    });
  }
}

/**
 * Creates [STORYBOARD] file containing ui description of Splash/Launch Screen.
 * > WARNING: modifies `pbxproj`
 */
export default async function configureStoryboard(
  iosProject: IosProject,
  {
    resizeMode,
    backgroundColor,
    splashScreenImagePresent,
  }: {
    resizeMode: ResizeMode;
    backgroundColor: ColorDescriptor;
    splashScreenImagePresent: boolean;
  }
) {
  let contentMode: string;
  switch (resizeMode) {
    case ResizeMode.CONTAIN:
      contentMode = 'scaleAspectFit';
      break;
    case ResizeMode.COVER:
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

  const filePath = path.resolve(iosProject.projectPath, STORYBOARD_FILE_PATH);
  await createDirAndWriteFile(
    filePath,
    `<?xml version="1.0" encoding="UTF-8"?>
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
            verticalHuggingPriority="251"${
              splashScreenImagePresent ? '\n            image="SplashScreen"' : ''
            }
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
`
  );

  await updatePbxProject(iosProject);
}
