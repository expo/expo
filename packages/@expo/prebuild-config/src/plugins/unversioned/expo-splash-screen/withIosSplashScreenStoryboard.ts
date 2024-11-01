import { BaseMods, ConfigPlugin, Mod, withMod } from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';
import { Parser } from 'xml2js';

import { IBSplashScreenDocument, toString } from './InterfaceBuilder';

export const STORYBOARD_FILE_PATH = './SplashScreen.storyboard';

const STORYBOARD_MOD_NAME = 'splashScreenStoryboard';

/**
 * Provides the SplashScreen `.storyboard` xml data for modification.
 *
 * @param config
 * @param action
 */
export const withIosSplashScreenStoryboard: ConfigPlugin<Mod<IBSplashScreenDocument>> = (
  config,
  action
) => {
  return withMod(config, {
    platform: 'ios',
    mod: STORYBOARD_MOD_NAME,
    action,
  });
};

/** Append a custom rule to supply SplashScreen `.storyboard` xml data to mods on `mods.ios.splashScreenStoryboard` */
export const withIosSplashScreenStoryboardBaseMod: ConfigPlugin = (config) => {
  return BaseMods.withGeneratedBaseMods(config, {
    platform: 'ios',
    saveToInternal: true,
    skipEmptyMod: false,
    providers: {
      // Append a custom rule to supply .storyboard xml data to mods on `mods.ios.splashScreenStoryboard`
      [STORYBOARD_MOD_NAME]: BaseMods.provider<IBSplashScreenDocument>({
        isIntrospective: true,
        async getFilePath({ modRequest }) {
          //: [root]/myapp/ios/MyApp/SplashScreen.storyboard
          return path.join(
            //: myapp/ios
            modRequest.platformProjectRoot,
            // ./MyApp
            modRequest.projectName!,
            // ./SplashScreen.storyboard
            STORYBOARD_FILE_PATH
          );
        },
        async read(filePath) {
          try {
            const contents = await fs.promises.readFile(filePath, 'utf8');
            const xml = await new Parser().parseStringPromise(contents);
            return xml;
          } catch {
            return getTemplateAsync();
          }
        },
        async write(filePath, { modResults, modRequest: { introspect } }) {
          if (introspect) {
            return;
          }
          await fs.promises.writeFile(filePath, toString(modResults));
        },
      }),
    },
  });
};

/** Get a template splash screen storyboard file. */
export async function getTemplateAsync(): Promise<IBSplashScreenDocument> {
  const contents = `<?xml version="1.0" encoding="UTF-8"?>
  <document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="32700.99.1234" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="EXPO-VIEWCONTROLLER-1">
      <device id="retina6_12" orientation="portrait" appearance="light"/>
      <dependencies>
          <deployment identifier="iOS"/>
          <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="22685"/>
          <capability name="Safe area layout guides" minToolsVersion="9.0"/>
          <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>
      </dependencies>
      <scenes>
          <!--View Controller-->
          <scene sceneID="EXPO-SCENE-1">
              <objects>
                  <viewController storyboardIdentifier="SplashScreenViewController" id="EXPO-VIEWCONTROLLER-1" sceneMemberID="viewController">
                      <view key="view" userInteractionEnabled="NO" contentMode="scaleToFill" insetsLayoutMarginsFromSafeArea="NO" id="EXPO-ContainerView" userLabel="ContainerView">
                          <rect key="frame" x="0.0" y="0.0" width="393" height="852"/>
                          <autoresizingMask key="autoresizingMask" flexibleMaxX="YES" flexibleMaxY="YES"/>
                          <subviews>
                              <imageView clipsSubviews="YES" userInteractionEnabled="NO" contentMode="scaleAspectFit" horizontalHuggingPriority="251" verticalHuggingPriority="251" image="SplashScreen" translatesAutoresizingMaskIntoConstraints="NO" id="EXPO-SplashScreen" userLabel="SplashScreen">
                                  <rect key="frame" x="146.66666666666666" y="381" width="100" height="90.333333333333314"/>
                              </imageView>
                          </subviews>
                          <viewLayoutGuide key="safeArea" id="Rmq-lb-GrQ"/>
                          <constraints>
                              <constraint firstItem="EXPO-SplashScreen" firstAttribute="centerY" secondItem="EXPO-ContainerView" secondAttribute="centerY" id="0VC-Wk-OaO"/>
                              <constraint firstItem="EXPO-SplashScreen" firstAttribute="centerX" secondItem="EXPO-ContainerView" secondAttribute="centerX" id="zR4-NK-mVN"/>
                          </constraints>
                      </view>
                  </viewController>
                  <placeholder placeholderIdentifier="IBFirstResponder" id="EXPO-PLACEHOLDER-1" userLabel="First Responder" sceneMemberID="firstResponder"/>
              </objects>
              <point key="canvasLocation" x="140.625" y="129.4921875"/>
          </scene>
      </scenes>
      <resources>
          <image name="SplashScreenLogo" width="100" height="90.333335876464844"/>
      </resources>
  </document>`;
  return await new Parser().parseStringPromise(contents);
}
