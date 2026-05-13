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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.withIosSplashScreenStoryboardBaseMod = exports.withIosSplashScreenStoryboard = exports.STORYBOARD_FILE_PATH = void 0;
exports.getTemplateAsync = getTemplateAsync;
const config_plugins_1 = require("expo/config-plugins");
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
                          <color key="backgroundColor" name="SplashScreenBackground"/>
                      </view>
                  </viewController>
                  <placeholder placeholderIdentifier="IBFirstResponder" id="EXPO-PLACEHOLDER-1" userLabel="First Responder" sceneMemberID="firstResponder"/>
              </objects>
              <point key="canvasLocation" x="140.625" y="129.4921875"/>
          </scene>
      </scenes>
      <resources>
          <image name="SplashScreenLogo" width="100" height="90.333335876464844"/>
          <namedColor name="SplashScreenBackground">
            <color alpha="1.000" blue="1.00000000000000" green="1.00000000000000" red="1.00000000000000" customColorSpace="sRGB" colorSpace="custom"/>
          </namedColor>
      </resources>
  </document>`;
    return await new xml2js_1.Parser().parseStringPromise(contents);
}
