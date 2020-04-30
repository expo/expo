import * as colorString from 'color-string';
import { vol } from 'memfs';

import { ResizeMode } from '../../constants';
import configureStoryboard from '../Storyboard';
import readPbxProject from '../pbxproj';
import reactNativeProject from './fixtures/react-native-project-structure';

// in `__mocks__/fs.ts` memfs is being used as a mocking library
jest.mock('fs');
// in `__mocks__/xcode.ts` parsing job for `.pbxproj` is performed synchronously on single tread
jest.mock('xcode');

describe('Storyboard', () => {
  describe('configureStoryboard', () => {
    beforeEach(() => {
      vol.fromJSON(reactNativeProject, '/app');
    });
    afterEach(() => {
      vol.reset();
    });

    const iosProjectPath = `/app/ios`;
    const filePath = `${iosProjectPath}/ReactNativeProject/SplashScreen.storyboard`;

    it('creates .storyboard file', async () => {
      const iosProject = await readPbxProject(iosProjectPath);
      await configureStoryboard(iosProject, {
        resizeMode: ResizeMode.COVER,
        backgroundColor: colorString.get('#3DCE8719'),
        splashScreenImagePresent: false,
      });
      const actual = vol.readFileSync(filePath, 'utf-8');
      const expected = `<?xml version="1.0" encoding="UTF-8"?>
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
            contentMode="scaleAspectFill"
            horizontalHuggingPriority="251"
            verticalHuggingPriority="251"
            id="EXPO-IMAGEVIEW-1"
          >
            <rect key="frame" x="0.0" y="0.0" width="800" height="1600"/>
            <autoresizingMask key="autoresizingMask" flexibleMaxX="YES" flexibleMaxY="YES"/>
            <color key="backgroundColor" red="0.23921568627450981" green="0.807843137254902" blue="0.5294117647058824" alpha="0.1" colorSpace="custom" customColorSpace="sRGB"/>
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
`;
      expect(actual).toEqual(expected);
    });

    it('updates existing .storyboard file', async () => {
      vol.writeFileSync(
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
            contentMode="scaleAspectFill"
            horizontalHuggingPriority="251"
            verticalHuggingPriority="251"
            id="EXPO-IMAGEVIEW-1"
          >
            <rect key="frame" x="0.0" y="0.0" width="800" height="1600"/>
            <autoresizingMask key="autoresizingMask" flexibleMaxX="YES" flexibleMaxY="YES"/>
            <color key="backgroundColor" red="0.23921568627450981" green="0.807843137254902" blue="0.5294117647058824" alpha="0.1" colorSpace="custom" customColorSpace="sRGB"/>
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
      const iosProject = await readPbxProject(iosProjectPath);
      await configureStoryboard(iosProject, {
        resizeMode: ResizeMode.CONTAIN,
        backgroundColor: colorString.get('rgba(56, 145, 231, 0.78)'),
        splashScreenImagePresent: true,
      });
      const actual = vol.readFileSync(filePath, 'utf-8');
      const expected = `<?xml version="1.0" encoding="UTF-8"?>
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
            contentMode="scaleAspectFit"
            horizontalHuggingPriority="251"
            verticalHuggingPriority="251"
            image="SplashScreen"
            id="EXPO-IMAGEVIEW-1"
          >
            <rect key="frame" x="0.0" y="0.0" width="800" height="1600"/>
            <autoresizingMask key="autoresizingMask" flexibleMaxX="YES" flexibleMaxY="YES"/>
            <color key="backgroundColor" red="0.2196078431372549" green="0.5686274509803921" blue="0.9058823529411765" alpha="0.78" colorSpace="custom" customColorSpace="sRGB"/>
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
`;
      expect(actual).toEqual(expected);
    });

    it('throws upon ResizeMode.NATIVE', async () => {
      const iosProject = await readPbxProject(iosProjectPath);
      await expect(async () => {
        await configureStoryboard(iosProject, {
          resizeMode: ResizeMode.NATIVE,
          backgroundColor: colorString.get('red'),
          splashScreenImagePresent: false,
        });
      }).rejects.toThrow();
    });

    it('updates .pbxproj file', async () => {
      const iosProject = await readPbxProject(iosProjectPath);
      const original = iosProject.pbxProject.writeSync();
      await configureStoryboard(iosProject, {
        resizeMode: ResizeMode.COVER,
        backgroundColor: colorString.get('#3DCE8719'),
        splashScreenImagePresent: false,
      });

      const result = iosProject.pbxProject.writeSync();
      expect(result).not.toEqual(original);
      expect(result).toMatch(/Begin PBXBuildFile section(\n|.)*?^.*SplashScreen.*$(\n|.)*?End/m);
      expect(result).toMatch(
        /Begin PBXFileReference section(\n|.)*?^.*SplashScreen.*$(\n|.)*?End/m
      );
      expect(result).toMatch(
        /Begin PBXGroup section(\n|.)*?ReactNativeProject(\n|.)*?^.*SplashScreen.*$(\n|.)*?End/m
      );
      expect(result).toMatch(
        /Begin PBXResourcesBuildPhase section(\n|.)*?Images.xcassets(\n|.)*?^.*SplashScreen.*$(\n|.)*?End/m
      );
    });

    it('consecutive calls does not modify .pbxproj', async () => {
      const iosProject = await readPbxProject(iosProjectPath);
      await configureStoryboard(iosProject, {
        resizeMode: ResizeMode.COVER,
        backgroundColor: colorString.get('#3DCE8719'),
        splashScreenImagePresent: false,
      });
      const afterFirstCall = iosProject.pbxProject.writeSync();
      await configureStoryboard(iosProject, {
        resizeMode: ResizeMode.COVER,
        backgroundColor: colorString.get('#3DCE8719'),
        splashScreenImagePresent: false,
      });
      const afterSecondCall = iosProject.pbxProject.writeSync();
      expect(afterSecondCall).toEqual(afterFirstCall);
    });
  });
});
