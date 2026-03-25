"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.STORYBOARD_FILE_PATH = void 0;
exports.getTemplateAsync = getTemplateAsync;
exports.withIosSplashScreenStoryboardBaseMod = exports.withIosSplashScreenStoryboard = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
function fs() {
  const data = _interopRequireWildcard(require("fs"));
  fs = function () {
    return data;
  };
  return data;
}
function path() {
  const data = _interopRequireWildcard(require("path"));
  path = function () {
    return data;
  };
  return data;
}
function _xml2js() {
  const data = require("xml2js");
  _xml2js = function () {
    return data;
  };
  return data;
}
function _InterfaceBuilder() {
  const data = require("./InterfaceBuilder");
  _InterfaceBuilder = function () {
    return data;
  };
  return data;
}
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const STORYBOARD_FILE_PATH = exports.STORYBOARD_FILE_PATH = './SplashScreen.storyboard';
const STORYBOARD_MOD_NAME = 'splashScreenStoryboard';

/**
 * Provides the SplashScreen `.storyboard` xml data for modification.
 *
 * @param config
 * @param action
 */
const withIosSplashScreenStoryboard = (config, action) => {
  return (0, _configPlugins().withMod)(config, {
    platform: 'ios',
    mod: STORYBOARD_MOD_NAME,
    action
  });
};

/** Append a custom rule to supply SplashScreen `.storyboard` xml data to mods on `mods.ios.splashScreenStoryboard` */
exports.withIosSplashScreenStoryboard = withIosSplashScreenStoryboard;
const withIosSplashScreenStoryboardBaseMod = config => {
  return _configPlugins().BaseMods.withGeneratedBaseMods(config, {
    platform: 'ios',
    saveToInternal: true,
    skipEmptyMod: false,
    providers: {
      // Append a custom rule to supply .storyboard xml data to mods on `mods.ios.splashScreenStoryboard`
      [STORYBOARD_MOD_NAME]: _configPlugins().BaseMods.provider({
        isIntrospective: true,
        async getFilePath({
          modRequest
        }) {
          //: [root]/myapp/ios/MyApp/SplashScreen.storyboard
          return path().join(
          //: myapp/ios
          modRequest.platformProjectRoot,
          // ./MyApp
          modRequest.projectName,
          // ./SplashScreen.storyboard
          STORYBOARD_FILE_PATH);
        },
        async read(filePath) {
          try {
            const contents = await fs().promises.readFile(filePath, 'utf8');
            const xml = await new (_xml2js().Parser)().parseStringPromise(contents);
            return xml;
          } catch {
            return getTemplateAsync();
          }
        },
        async write(filePath, {
          modResults,
          modRequest: {
            introspect
          }
        }) {
          if (introspect) {
            return;
          }
          await fs().promises.writeFile(filePath, (0, _InterfaceBuilder().toString)(modResults));
        }
      })
    }
  });
};

/** Get a template splash screen storyboard file. */
exports.withIosSplashScreenStoryboardBaseMod = withIosSplashScreenStoryboardBaseMod;
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
  return await new (_xml2js().Parser)().parseStringPromise(contents);
}
//# sourceMappingURL=withIosSplashScreenStoryboard.js.map