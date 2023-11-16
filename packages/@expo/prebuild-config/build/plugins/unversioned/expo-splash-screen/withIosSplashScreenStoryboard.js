"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplateAsync = exports.withIosSplashScreenStoryboardBaseMod = exports.withIosSplashScreenStoryboard = exports.STORYBOARD_FILE_PATH = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const xml2js_1 = require("xml2js");
const InterfaceBuilder_1 = require("./InterfaceBuilder");
exports.STORYBOARD_FILE_PATH = './SplashScreen.storyboard';
const STORYBOARD_MOD_NAME = 'splashScreenStoryboard';
/**
 * Provides the SplashScreen `.storyboard` xml data for modification.
 *
 * @param config
 * @param action
 */
const withIosSplashScreenStoryboard = (config, action) => {
    return (0, config_plugins_1.withMod)(config, {
        platform: 'ios',
        mod: STORYBOARD_MOD_NAME,
        action,
    });
};
exports.withIosSplashScreenStoryboard = withIosSplashScreenStoryboard;
/** Append a custom rule to supply SplashScreen `.storyboard` xml data to mods on `mods.ios.splashScreenStoryboard` */
const withIosSplashScreenStoryboardBaseMod = (config) => {
    return config_plugins_1.BaseMods.withGeneratedBaseMods(config, {
        platform: 'ios',
        saveToInternal: true,
        skipEmptyMod: false,
        providers: {
            // Append a custom rule to supply .storyboard xml data to mods on `mods.ios.splashScreenStoryboard`
            [STORYBOARD_MOD_NAME]: config_plugins_1.BaseMods.provider({
                isIntrospective: true,
                async getFilePath({ modRequest }) {
                    //: [root]/myapp/ios/MyApp/SplashScreen.storyboard
                    return path.join(
                    //: myapp/ios
                    modRequest.platformProjectRoot, 
                    // ./MyApp
                    modRequest.projectName, 
                    // ./SplashScreen.storyboard
                    exports.STORYBOARD_FILE_PATH);
                },
                async read(filePath) {
                    try {
                        const contents = await fs.promises.readFile(filePath, 'utf8');
                        const xml = await new xml2js_1.Parser().parseStringPromise(contents);
                        return xml;
                    }
                    catch {
                        return getTemplateAsync();
                    }
                },
                async write(filePath, { modResults, modRequest: { introspect } }) {
                    if (introspect) {
                        return;
                    }
                    await fs.promises.writeFile(filePath, (0, InterfaceBuilder_1.toString)(modResults));
                },
            }),
        },
    });
};
exports.withIosSplashScreenStoryboardBaseMod = withIosSplashScreenStoryboardBaseMod;
/** Get a template splash screen storyboard file. */
async function getTemplateAsync() {
    const contents = `<?xml version="1.0" encoding="UTF-8"?>
    <document
      type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB"
      version="3.0"
      toolsVersion="16096"
      targetRuntime="iOS.CocoaTouch"
      propertyAccessControl="none"
      useAutolayout="YES"
      launchScreen="YES"
      useTraitCollections="YES"
      useSafeAreas="YES"
      colorMatched="YES"
      initialViewController="EXPO-VIEWCONTROLLER-1"
    >
      <dependencies>
        <deployment identifier="iOS"/>
        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="16087"/>
        <capability name="Safe area layout guides" minToolsVersion="9.0"/>
        <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>
      </dependencies>
      <scenes>
        <scene sceneID="EXPO-SCENE-1">
          <objects>
            <viewController
              storyboardIdentifier="SplashScreenViewController"
              id="EXPO-VIEWCONTROLLER-1"
              sceneMemberID="viewController"
            >
              <view
                key="view"
                userInteractionEnabled="NO"
                contentMode="scaleToFill"
                insetsLayoutMarginsFromSafeArea="NO"
                id="EXPO-ContainerView"
                userLabel="ContainerView"
              >
                <rect key="frame" x="0.0" y="0.0" width="414" height="736"/>
                <autoresizingMask key="autoresizingMask" flexibleMaxX="YES" flexibleMaxY="YES"/>
                <subviews>
                  <imageView
                    userInteractionEnabled="NO"
                    contentMode="scaleAspectFill"
                    horizontalHuggingPriority="251"
                    verticalHuggingPriority="251"
                    insetsLayoutMarginsFromSafeArea="NO"
                    image="SplashScreenBackground"
                    translatesAutoresizingMaskIntoConstraints="NO"
                    id="EXPO-SplashScreenBackground"
                    userLabel="SplashScreenBackground"
                  >
                    <rect key="frame" x="0.0" y="0.0" width="414" height="736"/>
                  </imageView>
                </subviews>
                <color key="backgroundColor" systemColor="systemBackgroundColor"/>
                <constraints>
                  <constraint firstItem="EXPO-SplashScreenBackground" firstAttribute="top" secondItem="EXPO-ContainerView" secondAttribute="top" id="1gX-mQ-vu6"/>
                  <constraint firstItem="EXPO-SplashScreenBackground" firstAttribute="leading" secondItem="EXPO-ContainerView" secondAttribute="leading" id="6tX-OG-Sck"/>
                  <constraint firstItem="EXPO-SplashScreenBackground" firstAttribute="trailing" secondItem="EXPO-ContainerView" secondAttribute="trailing" id="ABX-8g-7v4"/>
                  <constraint firstItem="EXPO-SplashScreenBackground" firstAttribute="bottom" secondItem="EXPO-ContainerView" secondAttribute="bottom" id="jkI-2V-eW5"/>
                </constraints>
                <viewLayoutGuide key="safeArea" id="EXPO-SafeArea"/>
              </view>
            </viewController>
            <placeholder placeholderIdentifier="IBFirstResponder" id="EXPO-PLACEHOLDER-1" userLabel="First Responder" sceneMemberID="firstResponder"/>
          </objects>
        </scene>
      </scenes>
      <resources>
        <image name="SplashScreenBackground" width="1" height="1"/>
      </resources>
    </document>`;
    return await new xml2js_1.Parser().parseStringPromise(contents);
}
exports.getTemplateAsync = getTemplateAsync;
