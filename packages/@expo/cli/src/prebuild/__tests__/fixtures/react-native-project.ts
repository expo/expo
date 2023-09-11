export default {
  'ios/ReactNativeProject/Supporting/Expo.plist': `<?xml version="1.0" encoding="UTF-8"?>
      <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
      <plist version="1.0">
      <dict>
      </dict>
      </plist>
      `,
  'ios/ReactNativeProject/Info.plist': `<?xml version="1.0" encoding="UTF-8"?>
      <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
      <plist version="1.0">
      <dict>
        <key>CFBundleDevelopmentRegion</key>
        <string>en</string>
        <key>CFBundleDisplayName</key>
        <string>ReactNativeProject</string>
        <key>CFBundleExecutable</key>
        <string>$(EXECUTABLE_NAME)</string>
        <key>CFBundleIdentifier</key>
        <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
        <key>CFBundleInfoDictionaryVersion</key>
        <string>6.0</string>
        <key>CFBundleName</key>
        <string>$(PRODUCT_NAME)</string>
        <key>CFBundlePackageType</key>
        <string>APPL</string>
        <key>CFBundleShortVersionString</key>
        <string>1.0</string>
        <key>CFBundleSignature</key>
        <string>????</string>
        <key>CFBundleVersion</key>
        <string>1</string>
        <key>LSRequiresIPhoneOS</key>
        <true/>
        <key>NSAppTransportSecurity</key>
        <dict>
          <key>NSAllowsArbitraryLoads</key>
          <true/>
          <key>NSExceptionDomains</key>
          <dict>
            <key>localhost</key>
            <dict>
              <key>NSExceptionAllowsInsecureHTTPLoads</key>
              <true/>
            </dict>
          </dict>
        </dict>
        <key>NSLocationWhenInUseUsageDescription</key>
        <string></string>
        <key>UILaunchStoryboardName</key>
        <string>LaunchScreen</string>
        <key>UIRequiredDeviceCapabilities</key>
        <array>
          <string>armv7</string>
        </array>
        <key>UISupportedInterfaceOrientations</key>
        <array>
          <string>UIInterfaceOrientationPortrait</string>
          <string>UIInterfaceOrientationLandscapeLeft</string>
          <string>UIInterfaceOrientationLandscapeRight</string>
        </array>
        <key>UIViewControllerBasedStatusBarAppearance</key>
        <false/>
      </dict>
      </plist>
      `,
  'ios/ReactNativeProject/AppDelegate.m': `#import "AppDelegate.h"
      
      #import <React/RCTBridge.h>
      #import <React/RCTBundleURLProvider.h>
      #import <React/RCTRootView.h>
      
      #if DEBUG
      #import <FlipperKit/FlipperClient.h>
      #import <FlipperKitLayoutPlugin/FlipperKitLayoutPlugin.h>
      #import <FlipperKitUserDefaultsPlugin/FKUserDefaultsPlugin.h>
      #import <FlipperKitNetworkPlugin/FlipperKitNetworkPlugin.h>
      #import <SKIOSNetworkPlugin/SKIOSNetworkAdapter.h>
      #import <FlipperKitReactPlugin/FlipperKitReactPlugin.h>
      
      static void InitializeFlipper(UIApplication *application) {
        FlipperClient *client = [FlipperClient sharedClient];
        SKDescriptorMapper *layoutDescriptorMapper = [[SKDescriptorMapper alloc] initWithDefaults];
        [client addPlugin:[[FlipperKitLayoutPlugin alloc] initWithRootNode:application withDescriptorMapper:layoutDescriptorMapper]];
        [client addPlugin:[[FKUserDefaultsPlugin alloc] initWithSuiteName:nil]];
        [client addPlugin:[FlipperKitReactPlugin new]];
        [client addPlugin:[[FlipperKitNetworkPlugin alloc] initWithNetworkAdapter:[SKIOSNetworkAdapter new]]];
        [client start];
      }
      #endif
      
      @implementation AppDelegate
      
      - (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
      {
      #if DEBUG
        InitializeFlipper(application);
      #endif
      
        RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
        RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                          moduleName:@"ReactNativeProject"
                                                  initialProperties:nil];
      
        rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];
      
        self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
        UIViewController *rootViewController = [UIViewController new];
        rootViewController.view = rootView;
        self.window.rootViewController = rootViewController;
        [self.window makeKeyAndVisible];
        return YES;
      }
      
      - (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
      {
      #if DEBUG
        return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@".expo/.virtual-metro-entry" fallbackResource:nil];
      #else
        return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
      #endif
      }
      
      @end
      `,
  'ios/ReactNativeProject/Base.lproj/LaunchScreen.xib': `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <document type="com.apple.InterfaceBuilder3.CocoaTouch.XIB" version="3.0" toolsVersion="7702" systemVersion="14D136" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES">
          <dependencies>
              <deployment identifier="iOS"/>
              <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="7701"/>
              <capability name="Constraints with non-1.0 multipliers" minToolsVersion="5.1"/>
          </dependencies>
          <objects>
              <placeholder placeholderIdentifier="IBFilesOwner" id="-1" userLabel="File's Owner"/>
              <placeholder placeholderIdentifier="IBFirstResponder" id="-2" customClass="UIResponder"/>
              <view contentMode="scaleToFill" id="iN0-l3-epB">
                  <rect key="frame" x="0.0" y="0.0" width="480" height="480"/>
                  <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                  <subviews>
                      <label opaque="NO" clipsSubviews="YES" userInteractionEnabled="NO" contentMode="left" horizontalHuggingPriority="251" verticalHuggingPriority="251" text="Powered by React Native" textAlignment="center" lineBreakMode="tailTruncation" baselineAdjustment="alignBaselines" minimumFontSize="9" translatesAutoresizingMaskIntoConstraints="NO" id="8ie-xW-0ye">
                          <rect key="frame" x="20" y="439" width="441" height="21"/>
                          <fontDescription key="fontDescription" type="system" pointSize="17"/>
                          <color key="textColor" cocoaTouchSystemColor="darkTextColor"/>
                          <nil key="highlightedColor"/>
                      </label>
                      <label opaque="NO" clipsSubviews="YES" userInteractionEnabled="NO" contentMode="left" horizontalHuggingPriority="251" verticalHuggingPriority="251" text="ReactNativeProject" textAlignment="center" lineBreakMode="middleTruncation" baselineAdjustment="alignBaselines" minimumFontSize="18" translatesAutoresizingMaskIntoConstraints="NO" id="kId-c2-rCX">
                          <rect key="frame" x="20" y="140" width="441" height="43"/>
                          <fontDescription key="fontDescription" type="boldSystem" pointSize="36"/>
                          <color key="textColor" cocoaTouchSystemColor="darkTextColor"/>
                          <nil key="highlightedColor"/>
                      </label>
                  </subviews>
                  <color key="backgroundColor" white="1" alpha="1" colorSpace="custom" customColorSpace="calibratedWhite"/>
                  <constraints>
                      <constraint firstItem="kId-c2-rCX" firstAttribute="centerY" secondItem="iN0-l3-epB" secondAttribute="bottom" multiplier="1/3" constant="1" id="5cJ-9S-tgC"/>
                      <constraint firstAttribute="centerX" secondItem="kId-c2-rCX" secondAttribute="centerX" id="Koa-jz-hwk"/>
                      <constraint firstAttribute="bottom" secondItem="8ie-xW-0ye" secondAttribute="bottom" constant="20" id="Kzo-t9-V3l"/>
                      <constraint firstItem="8ie-xW-0ye" firstAttribute="leading" secondItem="iN0-l3-epB" secondAttribute="leading" constant="20" symbolic="YES" id="MfP-vx-nX0"/>
                      <constraint firstAttribute="centerX" secondItem="8ie-xW-0ye" secondAttribute="centerX" id="ZEH-qu-HZ9"/>
                      <constraint firstItem="kId-c2-rCX" firstAttribute="leading" secondItem="iN0-l3-epB" secondAttribute="leading" constant="20" symbolic="YES" id="fvb-Df-36g"/>
                  </constraints>
                  <nil key="simulatedStatusBarMetrics"/>
                  <freeformSimulatedSizeMetrics key="simulatedDestinationMetrics"/>
                  <point key="canvasLocation" x="548" y="455"/>
              </view>
          </objects>
      </document>
       `,
  'ios/ReactNativeProject/Images.xcassets/AppIcon.appiconset/Contents.json': `{
        "images" : [
          {
            "idiom" : "iphone",
            "size" : "29x29",
            "scale" : "2x"
          },
          {
            "idiom" : "iphone",
            "size" : "29x29",
            "scale" : "3x"
          },
          {
            "idiom" : "iphone",
            "size" : "40x40",
            "scale" : "2x"
          },
          {
            "idiom" : "iphone",
            "size" : "40x40",
            "scale" : "3x"
          },
          {
            "idiom" : "iphone",
            "size" : "60x60",
            "scale" : "2x"
          },
          {
            "idiom" : "iphone",
            "size" : "60x60",
            "scale" : "3x"
          }
        ],
        "info" : {
          "version" : 1,
          "author" : "xcode"
        }
      }`,
  'ios/ReactNativeProject/Images.xcassets/Contents.json': `{
        "info" : {
          "version" : 1,
          "author" : "xcode"
        }
      }
      `,
  'ios/ReactNativeProject.xcodeproj/project.pbxproj': `// !$*UTF8*$!
      {
          archiveVersion = 1;
          classes = {
          };
          objectVersion = 46;
          objects = {
      
      /* Begin PBXBuildFile section */
              00E356F31AD99517003FC87E /* ReactNativeProjectTests.m in Sources */ = {isa = PBXBuildFile; fileRef = 00E356F21AD99517003FC87E /* ReactNativeProjectTests.m */; };
              13B07FBC1A68108700A75B9A /* AppDelegate.m in Sources */ = {isa = PBXBuildFile; fileRef = 13B07FB01A68108700A75B9A /* AppDelegate.m */; };
              13B07FBD1A68108700A75B9A /* LaunchScreen.xib in Resources */ = {isa = PBXBuildFile; fileRef = 13B07FB11A68108700A75B9A /* LaunchScreen.xib */; };
              13B07FBF1A68108700A75B9A /* Images.xcassets in Resources */ = {isa = PBXBuildFile; fileRef = 13B07FB51A68108700A75B9A /* Images.xcassets */; };
              13B07FC11A68108700A75B9A /* main.m in Sources */ = {isa = PBXBuildFile; fileRef = 13B07FB71A68108700A75B9A /* main.m */; };
              4B370DA44606A377CF63141B /* libPods-ReactNativeProject-ReactNativeProjectTests.a in Frameworks */ = {isa = PBXBuildFile; fileRef = 7671A2643A0F7BE16919D473 /* libPods-ReactNativeProject-ReactNativeProjectTests.a */; };
              60AEE1F74BD8DB47761ECAA0 /* libPods-ReactNativeProject.a in Frameworks */ = {isa = PBXBuildFile; fileRef = C571B07E8B81C69F6809DF07 /* libPods-ReactNativeProject.a */; };
      /* End PBXBuildFile section */
      
      /* Begin PBXContainerItemProxy section */
              00E356F41AD99517003FC87E /* PBXContainerItemProxy */ = {
                  isa = PBXContainerItemProxy;
                  containerPortal = 83CBB9F71A601CBA00E9B192 /* Project object */;
                  proxyType = 1;
                  remoteGlobalIDString = 13B07F861A680F5B00A75B9A;
                  remoteInfo = ReactNativeProject;
              };
      /* End PBXContainerItemProxy section */
      
      /* Begin PBXFileReference section */
              008F07F21AC5B25A0029DE68 /* main.jsbundle */ = {isa = PBXFileReference; fileEncoding = 4; lastKnownFileType = text; path = main.jsbundle; sourceTree = "<group>"; };
              00E356EE1AD99517003FC87E /* ReactNativeProjectTests.xctest */ = {isa = PBXFileReference; explicitFileType = wrapper.cfbundle; includeInIndex = 0; path = ReactNativeProjectTests.xctest; sourceTree = BUILT_PRODUCTS_DIR; };
              00E356F11AD99517003FC87E /* Info.plist */ = {isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = "<group>"; };
              00E356F21AD99517003FC87E /* ReactNativeProjectTests.m */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.c.objc; path = ReactNativeProjectTests.m; sourceTree = "<group>"; };
              13B07F961A680F5B00A75B9A /* ReactNativeProject.app */ = {isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = ReactNativeProject.app; sourceTree = BUILT_PRODUCTS_DIR; };
              13B07FAF1A68108700A75B9A /* AppDelegate.h */ = {isa = PBXFileReference; fileEncoding = 4; lastKnownFileType = sourcecode.c.h; name = AppDelegate.h; path = ReactNativeProject/AppDelegate.h; sourceTree = "<group>"; };
              13B07FB01A68108700A75B9A /* AppDelegate.m */ = {isa = PBXFileReference; fileEncoding = 4; lastKnownFileType = sourcecode.c.objc; name = AppDelegate.m; path = ReactNativeProject/AppDelegate.m; sourceTree = "<group>"; };
              13B07FB21A68108700A75B9A /* Base */ = {isa = PBXFileReference; lastKnownFileType = file.xib; name = Base; path = Base.lproj/LaunchScreen.xib; sourceTree = "<group>"; };
              13B07FB51A68108700A75B9A /* Images.xcassets */ = {isa = PBXFileReference; lastKnownFileType = folder.assetcatalog; name = Images.xcassets; path = ReactNativeProject/Images.xcassets; sourceTree = "<group>"; };
              13B07FB61A68108700A75B9A /* Info.plist */ = {isa = PBXFileReference; fileEncoding = 4; lastKnownFileType = text.plist.xml; name = Info.plist; path = ReactNativeProject/Info.plist; sourceTree = "<group>"; };
              13B07FB71A68108700A75B9A /* main.m */ = {isa = PBXFileReference; fileEncoding = 4; lastKnownFileType = sourcecode.c.objc; name = main.m; path = ReactNativeProject/main.m; sourceTree = "<group>"; };
              40C3418ACC823FDBB8E043EE /* libPods-ReactNativeProject-tvOSTests.a */ = {isa = PBXFileReference; explicitFileType = archive.ar; includeInIndex = 0; path = "libPods-ReactNativeProject-tvOSTests.a"; sourceTree = BUILT_PRODUCTS_DIR; };
              6561A35EBD3559C868AF5144 /* libPods-ReactNativeProject-tvOS.a */ = {isa = PBXFileReference; explicitFileType = archive.ar; includeInIndex = 0; path = "libPods-ReactNativeProject-tvOS.a"; sourceTree = BUILT_PRODUCTS_DIR; };
              7671A2643A0F7BE16919D473 /* libPods-ReactNativeProject-ReactNativeProjectTests.a */ = {isa = PBXFileReference; explicitFileType = archive.ar; includeInIndex = 0; path = "libPods-ReactNativeProject-ReactNativeProjectTests.a"; sourceTree = BUILT_PRODUCTS_DIR; };
              8A2AE9B83D633AB9012EE7AD /* Pods-ReactNativeProject-tvOSTests.release.xcconfig */ = {isa = PBXFileReference; includeInIndex = 1; lastKnownFileType = text.xcconfig; name = "Pods-ReactNativeProject-tvOSTests.release.xcconfig"; path = "Target Support Files/Pods-ReactNativeProject-tvOSTests/Pods-ReactNativeProject-tvOSTests.release.xcconfig"; sourceTree = "<group>"; };
              8CCF8538F230DE9FA56C3A08 /* Pods-ReactNativeProject-ReactNativeProjectTests.release.xcconfig */ = {isa = PBXFileReference; includeInIndex = 1; lastKnownFileType = text.xcconfig; name = "Pods-ReactNativeProject-ReactNativeProjectTests.release.xcconfig"; path = "Target Support Files/Pods-ReactNativeProject-ReactNativeProjectTests/Pods-ReactNativeProject-ReactNativeProjectTests.release.xcconfig"; sourceTree = "<group>"; };
              92F15A6F91E71246CC5491A1 /* Pods-ReactNativeProject.release.xcconfig */ = {isa = PBXFileReference; includeInIndex = 1; lastKnownFileType = text.xcconfig; name = "Pods-ReactNativeProject.release.xcconfig"; path = "Target Support Files/Pods-ReactNativeProject/Pods-ReactNativeProject.release.xcconfig"; sourceTree = "<group>"; };
              AA019B1CDE25FAE085310A13 /* Pods-ReactNativeProject-tvOS.release.xcconfig */ = {isa = PBXFileReference; includeInIndex = 1; lastKnownFileType = text.xcconfig; name = "Pods-ReactNativeProject-tvOS.release.xcconfig"; path = "Target Support Files/Pods-ReactNativeProject-tvOS/Pods-ReactNativeProject-tvOS.release.xcconfig"; sourceTree = "<group>"; };
              C571B07E8B81C69F6809DF07 /* libPods-ReactNativeProject.a */ = {isa = PBXFileReference; explicitFileType = archive.ar; includeInIndex = 0; path = "libPods-ReactNativeProject.a"; sourceTree = BUILT_PRODUCTS_DIR; };
              CE33E6645D2F2C6E99FA9E58 /* Pods-ReactNativeProject-ReactNativeProjectTests.debug.xcconfig */ = {isa = PBXFileReference; includeInIndex = 1; lastKnownFileType = text.xcconfig; name = "Pods-ReactNativeProject-ReactNativeProjectTests.debug.xcconfig"; path = "Target Support Files/Pods-ReactNativeProject-ReactNativeProjectTests/Pods-ReactNativeProject-ReactNativeProjectTests.debug.xcconfig"; sourceTree = "<group>"; };
              D6F5BBE0F6FACD4BBA3B8336 /* Pods-ReactNativeProject-tvOSTests.debug.xcconfig */ = {isa = PBXFileReference; includeInIndex = 1; lastKnownFileType = text.xcconfig; name = "Pods-ReactNativeProject-tvOSTests.debug.xcconfig"; path = "Target Support Files/Pods-ReactNativeProject-tvOSTests/Pods-ReactNativeProject-tvOSTests.debug.xcconfig"; sourceTree = "<group>"; };
              ED297162215061F000B7C4FE /* JavaScriptCore.framework */ = {isa = PBXFileReference; lastKnownFileType = wrapper.framework; name = JavaScriptCore.framework; path = System/Library/Frameworks/JavaScriptCore.framework; sourceTree = SDKROOT; };
              ED2971642150620600B7C4FE /* JavaScriptCore.framework */ = {isa = PBXFileReference; lastKnownFileType = wrapper.framework; name = JavaScriptCore.framework; path = Platforms/AppleTVOS.platform/Developer/SDKs/AppleTVOS12.0.sdk/System/Library/Frameworks/JavaScriptCore.framework; sourceTree = DEVELOPER_DIR; };
              F15EE64A4C9D5BC341D8E4BC /* Pods-ReactNativeProject.debug.xcconfig */ = {isa = PBXFileReference; includeInIndex = 1; lastKnownFileType = text.xcconfig; name = "Pods-ReactNativeProject.debug.xcconfig"; path = "Target Support Files/Pods-ReactNativeProject/Pods-ReactNativeProject.debug.xcconfig"; sourceTree = "<group>"; };
              FD7429ABFA374F992514CD26 /* Pods-ReactNativeProject-tvOS.debug.xcconfig */ = {isa = PBXFileReference; includeInIndex = 1; lastKnownFileType = text.xcconfig; name = "Pods-ReactNativeProject-tvOS.debug.xcconfig"; path = "Target Support Files/Pods-ReactNativeProject-tvOS/Pods-ReactNativeProject-tvOS.debug.xcconfig"; sourceTree = "<group>"; };
      /* End PBXFileReference section */
      
      /* Begin PBXFrameworksBuildPhase section */
              00E356EB1AD99517003FC87E /* Frameworks */ = {
                  isa = PBXFrameworksBuildPhase;
                  buildActionMask = 2147483647;
                  files = (
                      4B370DA44606A377CF63141B /* libPods-ReactNativeProject-ReactNativeProjectTests.a in Frameworks */,
                  );
                  runOnlyForDeploymentPostprocessing = 0;
              };
              13B07F8C1A680F5B00A75B9A /* Frameworks */ = {
                  isa = PBXFrameworksBuildPhase;
                  buildActionMask = 2147483647;
                  files = (
                      60AEE1F74BD8DB47761ECAA0 /* libPods-ReactNativeProject.a in Frameworks */,
                  );
                  runOnlyForDeploymentPostprocessing = 0;
              };
      /* End PBXFrameworksBuildPhase section */
      
      /* Begin PBXGroup section */
              00E356EF1AD99517003FC87E /* ReactNativeProjectTests */ = {
                  isa = PBXGroup;
                  children = (
                      00E356F21AD99517003FC87E /* ReactNativeProjectTests.m */,
                      00E356F01AD99517003FC87E /* Supporting Files */,
                  );
                  path = ReactNativeProjectTests;
                  sourceTree = "<group>";
              };
              00E356F01AD99517003FC87E /* Supporting Files */ = {
                  isa = PBXGroup;
                  children = (
                      00E356F11AD99517003FC87E /* Info.plist */,
                  );
                  name = "Supporting Files";
                  sourceTree = "<group>";
              };
              13B07FAE1A68108700A75B9A /* ReactNativeProject */ = {
                  isa = PBXGroup;
                  children = (
                      008F07F21AC5B25A0029DE68 /* main.jsbundle */,
                      13B07FAF1A68108700A75B9A /* AppDelegate.h */,
                      13B07FB01A68108700A75B9A /* AppDelegate.m */,
                      13B07FB51A68108700A75B9A /* Images.xcassets */,
                      13B07FB61A68108700A75B9A /* Info.plist */,
                      13B07FB11A68108700A75B9A /* LaunchScreen.xib */,
                      13B07FB71A68108700A75B9A /* main.m */,
                  );
                  name = ReactNativeProject;
                  sourceTree = "<group>";
              };
              2D16E6871FA4F8E400B85C8A /* Frameworks */ = {
                  isa = PBXGroup;
                  children = (
                      ED297162215061F000B7C4FE /* JavaScriptCore.framework */,
                      ED2971642150620600B7C4FE /* JavaScriptCore.framework */,
                      C571B07E8B81C69F6809DF07 /* libPods-ReactNativeProject.a */,
                      7671A2643A0F7BE16919D473 /* libPods-ReactNativeProject-ReactNativeProjectTests.a */,
                      6561A35EBD3559C868AF5144 /* libPods-ReactNativeProject-tvOS.a */,
                      40C3418ACC823FDBB8E043EE /* libPods-ReactNativeProject-tvOSTests.a */,
                  );
                  name = Frameworks;
                  sourceTree = "<group>";
              };
              832341AE1AAA6A7D00B99B32 /* Libraries */ = {
                  isa = PBXGroup;
                  children = (
                  );
                  name = Libraries;
                  sourceTree = "<group>";
              };
              83CBB9F61A601CBA00E9B192 = {
                  isa = PBXGroup;
                  children = (
                      13B07FAE1A68108700A75B9A /* ReactNativeProject */,
                      832341AE1AAA6A7D00B99B32 /* Libraries */,
                      00E356EF1AD99517003FC87E /* ReactNativeProjectTests */,
                      83CBBA001A601CBA00E9B192 /* Products */,
                      2D16E6871FA4F8E400B85C8A /* Frameworks */,
                      9A0B45CE531ED53EAF0DA55A /* Pods */,
                  );
                  indentWidth = 2;
                  sourceTree = "<group>";
                  tabWidth = 2;
                  usesTabs = 0;
              };
              83CBBA001A601CBA00E9B192 /* Products */ = {
                  isa = PBXGroup;
                  children = (
                      13B07F961A680F5B00A75B9A /* ReactNativeProject.app */,
                      00E356EE1AD99517003FC87E /* ReactNativeProjectTests.xctest */,
                  );
                  name = Products;
                  sourceTree = "<group>";
              };
              9A0B45CE531ED53EAF0DA55A /* Pods */ = {
                  isa = PBXGroup;
                  children = (
                      F15EE64A4C9D5BC341D8E4BC /* Pods-ReactNativeProject.debug.xcconfig */,
                      92F15A6F91E71246CC5491A1 /* Pods-ReactNativeProject.release.xcconfig */,
                      CE33E6645D2F2C6E99FA9E58 /* Pods-ReactNativeProject-ReactNativeProjectTests.debug.xcconfig */,
                      8CCF8538F230DE9FA56C3A08 /* Pods-ReactNativeProject-ReactNativeProjectTests.release.xcconfig */,
                      FD7429ABFA374F992514CD26 /* Pods-ReactNativeProject-tvOS.debug.xcconfig */,
                      AA019B1CDE25FAE085310A13 /* Pods-ReactNativeProject-tvOS.release.xcconfig */,
                      D6F5BBE0F6FACD4BBA3B8336 /* Pods-ReactNativeProject-tvOSTests.debug.xcconfig */,
                      8A2AE9B83D633AB9012EE7AD /* Pods-ReactNativeProject-tvOSTests.release.xcconfig */,
                  );
                  path = Pods;
                  sourceTree = "<group>";
              };
      /* End PBXGroup section */
      
      /* Begin PBXNativeTarget section */
              00E356ED1AD99517003FC87E /* ReactNativeProjectTests */ = {
                  isa = PBXNativeTarget;
                  buildConfigurationList = 00E357021AD99517003FC87E /* Build configuration list for PBXNativeTarget "ReactNativeProjectTests" */;
                  buildPhases = (
                      027ED265C5A283E45FB44549 /* [CP] Check Pods Manifest.lock */,
                      00E356EA1AD99517003FC87E /* Sources */,
                      00E356EB1AD99517003FC87E /* Frameworks */,
                      00E356EC1AD99517003FC87E /* Resources */,
                  );
                  buildRules = (
                  );
                  dependencies = (
                      00E356F51AD99517003FC87E /* PBXTargetDependency */,
                  );
                  name = ReactNativeProjectTests;
                  productName = ReactNativeProjectTests;
                  productReference = 00E356EE1AD99517003FC87E /* ReactNativeProjectTests.xctest */;
                  productType = "com.apple.product-type.bundle.unit-test";
              };
              13B07F861A680F5B00A75B9A /* ReactNativeProject */ = {
                  isa = PBXNativeTarget;
                  buildConfigurationList = 13B07F931A680F5B00A75B9A /* Build configuration list for PBXNativeTarget "ReactNativeProject" */;
                  buildPhases = (
                      238A755D8286A59031418306 /* [CP] Check Pods Manifest.lock */,
                      FD10A7F022414F080027D42C /* Start Packager */,
                      13B07F871A680F5B00A75B9A /* Sources */,
                      13B07F8C1A680F5B00A75B9A /* Frameworks */,
                      13B07F8E1A680F5B00A75B9A /* Resources */,
                      00DD1BFF1BD5951E006B06BC /* Bundle React Native code and images */,
                  );
                  buildRules = (
                  );
                  dependencies = (
                  );
                  name = ReactNativeProject;
                  productName = ReactNativeProject;
                  productReference = 13B07F961A680F5B00A75B9A /* ReactNativeProject.app */;
                  productType = "com.apple.product-type.application";
              };
      /* End PBXNativeTarget section */
      
      /* Begin PBXProject section */
              83CBB9F71A601CBA00E9B192 /* Project object */ = {
                  isa = PBXProject;
                  attributes = {
                      LastUpgradeCheck = 1130;
                      TargetAttributes = {
                          00E356ED1AD99517003FC87E = {
                              CreatedOnToolsVersion = 6.2;
                              TestTargetID = 13B07F861A680F5B00A75B9A;
                          };
                          13B07F861A680F5B00A75B9A = {
                              LastSwiftMigration = 1120;
                          };
                      };
                  };
                  buildConfigurationList = 83CBB9FA1A601CBA00E9B192 /* Build configuration list for PBXProject "ReactNativeProject" */;
                  compatibilityVersion = "Xcode 3.2";
                  developmentRegion = en;
                  hasScannedForEncodings = 0;
                  knownRegions = (
                      en,
                      Base,
                  );
                  mainGroup = 83CBB9F61A601CBA00E9B192;
                  productRefGroup = 83CBBA001A601CBA00E9B192 /* Products */;
                  projectDirPath = "";
                  projectRoot = "";
                  targets = (
                      13B07F861A680F5B00A75B9A /* ReactNativeProject */,
                      00E356ED1AD99517003FC87E /* ReactNativeProjectTests */,
                  );
              };
      /* End PBXProject section */
      
      /* Begin PBXResourcesBuildPhase section */
              00E356EC1AD99517003FC87E /* Resources */ = {
                  isa = PBXResourcesBuildPhase;
                  buildActionMask = 2147483647;
                  files = (
                  );
                  runOnlyForDeploymentPostprocessing = 0;
              };
              13B07F8E1A680F5B00A75B9A /* Resources */ = {
                  isa = PBXResourcesBuildPhase;
                  buildActionMask = 2147483647;
                  files = (
                      13B07FBF1A68108700A75B9A /* Images.xcassets in Resources */,
                      13B07FBD1A68108700A75B9A /* LaunchScreen.xib in Resources */,
                  );
                  runOnlyForDeploymentPostprocessing = 0;
              };
      /* End PBXResourcesBuildPhase section */
      
      /* Begin PBXShellScriptBuildPhase section */
              00DD1BFF1BD5951E006B06BC /* Bundle React Native code and images */ = {
                  isa = PBXShellScriptBuildPhase;
                  buildActionMask = 2147483647;
                  files = (
                  );
                  inputPaths = (
                  );
                  name = "Bundle React Native code and images";
                  outputPaths = (
                  );
                  runOnlyForDeploymentPostprocessing = 0;
                  shellPath = /bin/sh;
                  shellScript = "export NODE_BINARY=node\n../node_modules/react-native/scripts/react-native-xcode.sh";
              };
              027ED265C5A283E45FB44549 /* [CP] Check Pods Manifest.lock */ = {
                  isa = PBXShellScriptBuildPhase;
                  buildActionMask = 2147483647;
                  files = (
                  );
                  inputFileListPaths = (
                  );
                  inputPaths = (
                      "\${PODS_PODFILE_DIR_PATH}/Podfile.lock",
                      "\${PODS_ROOT}/Manifest.lock",
                  );
                  name = "[CP] Check Pods Manifest.lock";
                  outputFileListPaths = (
                  );
                  outputPaths = (
                      "$(DERIVED_FILE_DIR)/Pods-ReactNativeProject-ReactNativeProjectTests-checkManifestLockResult.txt",
                  );
                  runOnlyForDeploymentPostprocessing = 0;
                  shellPath = /bin/sh;
                  shellScript = "diff \\"\${PODS_PODFILE_DIR_PATH}/Podfile.lock\\" \\"\${PODS_ROOT}/Manifest.lock\\" > /dev/null\nif [ $? != 0 ] ; then\n    # print error to STDERR\n    echo \\"error: The sandbox is not in sync with the Podfile.lock. Run 'pod install' or update your CocoaPods installation.\\" >&2\n    exit 1\nfi\n# This output is used by Xcode 'outputs' to avoid re-running this script phase.\necho \\"SUCCESS\\" > \\"\${SCRIPT_OUTPUT_FILE_0}\\"\n";
                  showEnvVarsInLog = 0;
              };
              238A755D8286A59031418306 /* [CP] Check Pods Manifest.lock */ = {
                  isa = PBXShellScriptBuildPhase;
                  buildActionMask = 2147483647;
                  files = (
                  );
                  inputFileListPaths = (
                  );
                  inputPaths = (
                      "\${PODS_PODFILE_DIR_PATH}/Podfile.lock",
                      "\${PODS_ROOT}/Manifest.lock",
                  );
                  name = "[CP] Check Pods Manifest.lock";
                  outputFileListPaths = (
                  );
                  outputPaths = (
                      "$(DERIVED_FILE_DIR)/Pods-ReactNativeProject-checkManifestLockResult.txt",
                  );
                  runOnlyForDeploymentPostprocessing = 0;
                  shellPath = /bin/sh;
                  shellScript = "diff \\"\${PODS_PODFILE_DIR_PATH}/Podfile.lock\\" \\"\${PODS_ROOT}/Manifest.lock\\" > /dev/null\nif [ $? != 0 ] ; then\n    # print error to STDERR\n    echo \\"error: The sandbox is not in sync with the Podfile.lock. Run 'pod install' or update your CocoaPods installation.\\" >&2\n    exit 1\nfi\n# This output is used by Xcode 'outputs' to avoid re-running this script phase.\necho \\"SUCCESS\\" > \\"\${SCRIPT_OUTPUT_FILE_0}\\"\n";
                  showEnvVarsInLog = 0;
              };
              FD10A7F022414F080027D42C /* Start Packager */ = {
                  isa = PBXShellScriptBuildPhase;
                  buildActionMask = 2147483647;
                  files = (
                  );
                  inputFileListPaths = (
                  );
                  inputPaths = (
                  );
                  name = "Start Packager";
                  outputFileListPaths = (
                  );
                  outputPaths = (
                  );
                  runOnlyForDeploymentPostprocessing = 0;
                  shellPath = /bin/sh;
                  shellScript = "export RCT_METRO_PORT=\\"\${RCT_METRO_PORT:=8081}\\"\necho \\"export RCT_METRO_PORT=\${RCT_METRO_PORT}\\" > \\"\${SRCROOT}/../node_modules/react-native/scripts/.packager.env\\"\nif [ -z \\"\${RCT_NO_LAUNCH_PACKAGER+xxx}\\" ] ; then\n  if nc -w 5 -z localhost \${RCT_METRO_PORT} ; then\n    if ! curl -s \\"http://localhost:\${RCT_METRO_PORT}/status\\" | grep -q \\"packager-status:running\\" ; then\n      echo \\"Port \${RCT_METRO_PORT} already in use, packager is either not running or not running correctly\\"\n      exit 2\n    fi\n  else\n    open \\"$SRCROOT/../node_modules/expo/scripts/launchPackager.command\\" || echo \\"Can't start packager automatically\\"\n  fi\nfi\n";
                  showEnvVarsInLog = 0;
              };
      /* End PBXShellScriptBuildPhase section */
      
      /* Begin PBXSourcesBuildPhase section */
              00E356EA1AD99517003FC87E /* Sources */ = {
                  isa = PBXSourcesBuildPhase;
                  buildActionMask = 2147483647;
                  files = (
                      00E356F31AD99517003FC87E /* ReactNativeProjectTests.m in Sources */,
                  );
                  runOnlyForDeploymentPostprocessing = 0;
              };
              13B07F871A680F5B00A75B9A /* Sources */ = {
                  isa = PBXSourcesBuildPhase;
                  buildActionMask = 2147483647;
                  files = (
                      13B07FBC1A68108700A75B9A /* AppDelegate.m in Sources */,
                      13B07FC11A68108700A75B9A /* main.m in Sources */,
                  );
                  runOnlyForDeploymentPostprocessing = 0;
              };
      /* End PBXSourcesBuildPhase section */
      
      /* Begin PBXTargetDependency section */
              00E356F51AD99517003FC87E /* PBXTargetDependency */ = {
                  isa = PBXTargetDependency;
                  target = 13B07F861A680F5B00A75B9A /* ReactNativeProject */;
                  targetProxy = 00E356F41AD99517003FC87E /* PBXContainerItemProxy */;
              };
      /* End PBXTargetDependency section */
      
      /* Begin PBXVariantGroup section */
              13B07FB11A68108700A75B9A /* LaunchScreen.xib */ = {
                  isa = PBXVariantGroup;
                  children = (
                      13B07FB21A68108700A75B9A /* Base */,
                  );
                  name = LaunchScreen.xib;
                  path = ReactNativeProject;
                  sourceTree = "<group>";
              };
      /* End PBXVariantGroup section */
      
      /* Begin XCBuildConfiguration section */
              00E356F61AD99517003FC87E /* Debug */ = {
                  isa = XCBuildConfiguration;
                  baseConfigurationReference = CE33E6645D2F2C6E99FA9E58 /* Pods-ReactNativeProject-ReactNativeProjectTests.debug.xcconfig */;
                  buildSettings = {
                      BUNDLE_LOADER = "$(TEST_HOST)";
                      GCC_PREPROCESSOR_DEFINITIONS = (
                          "DEBUG=1",
                          "$(inherited)",
                      );
                      INFOPLIST_FILE = ReactNativeProjectTests/Info.plist;
                      IPHONEOS_DEPLOYMENT_TARGET = 9.0;
                      LD_RUNPATH_SEARCH_PATHS = "$(inherited) @executable_path/Frameworks @loader_path/Frameworks";
                      OTHER_LDFLAGS = (
                          "-ObjC",
                          "-lc++",
                          "$(inherited)",
                      );
                      PRODUCT_BUNDLE_IDENTIFIER = "org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier)";
                      PRODUCT_NAME = "$(TARGET_NAME)";
                      TEST_HOST = "$(BUILT_PRODUCTS_DIR)/ReactNativeProject.app/ReactNativeProject";
                  };
                  name = Debug;
              };
              00E356F71AD99517003FC87E /* Release */ = {
                  isa = XCBuildConfiguration;
                  baseConfigurationReference = 8CCF8538F230DE9FA56C3A08 /* Pods-ReactNativeProject-ReactNativeProjectTests.release.xcconfig */;
                  buildSettings = {
                      BUNDLE_LOADER = "$(TEST_HOST)";
                      COPY_PHASE_STRIP = NO;
                      INFOPLIST_FILE = ReactNativeProjectTests/Info.plist;
                      IPHONEOS_DEPLOYMENT_TARGET = 9.0;
                      LD_RUNPATH_SEARCH_PATHS = "$(inherited) @executable_path/Frameworks @loader_path/Frameworks";
                      OTHER_LDFLAGS = (
                          "-ObjC",
                          "-lc++",
                          "$(inherited)",
                      );
                      PRODUCT_BUNDLE_IDENTIFIER = "org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier)";
                      PRODUCT_NAME = "$(TARGET_NAME)";
                      TEST_HOST = "$(BUILT_PRODUCTS_DIR)/ReactNativeProject.app/ReactNativeProject";
                  };
                  name = Release;
              };
              13B07F941A680F5B00A75B9A /* Debug */ = {
                  isa = XCBuildConfiguration;
                  baseConfigurationReference = F15EE64A4C9D5BC341D8E4BC /* Pods-ReactNativeProject.debug.xcconfig */;
                  buildSettings = {
                      ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
                      CLANG_ENABLE_MODULES = YES;
                      CURRENT_PROJECT_VERSION = 1;
                      ENABLE_BITCODE = NO;
                      GCC_PREPROCESSOR_DEFINITIONS = (
                          "$(inherited)",
                          "FB_SONARKIT_ENABLED=1",
                      );
                      INFOPLIST_FILE = ReactNativeProject/Info.plist;
                      LD_RUNPATH_SEARCH_PATHS = "$(inherited) @executable_path/Frameworks";
                      OTHER_LDFLAGS = (
                          "$(inherited)",
                          "-ObjC",
                          "-lc++",
                      );
                      PRODUCT_BUNDLE_IDENTIFIER = "org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier)";
                      PRODUCT_NAME = ReactNativeProject;
                      SWIFT_OPTIMIZATION_LEVEL = "-Onone";
                      SWIFT_VERSION = 5.0;
                      VERSIONING_SYSTEM = "apple-generic";
                  };
                  name = Debug;
              };
              13B07F951A680F5B00A75B9A /* Release */ = {
                  isa = XCBuildConfiguration;
                  baseConfigurationReference = 92F15A6F91E71246CC5491A1 /* Pods-ReactNativeProject.release.xcconfig */;
                  buildSettings = {
                      ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
                      CLANG_ENABLE_MODULES = YES;
                      CURRENT_PROJECT_VERSION = 1;
                      INFOPLIST_FILE = ReactNativeProject/Info.plist;
                      LD_RUNPATH_SEARCH_PATHS = "$(inherited) @executable_path/Frameworks";
                      OTHER_LDFLAGS = (
                          "$(inherited)",
                          "-ObjC",
                          "-lc++",
                      );
                      PRODUCT_BUNDLE_IDENTIFIER = "org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier)";
                      PRODUCT_NAME = ReactNativeProject;
                      SWIFT_VERSION = 5.0;
                      VERSIONING_SYSTEM = "apple-generic";
                  };
                  name = Release;
              };
              83CBBA201A601CBA00E9B192 /* Debug */ = {
                  isa = XCBuildConfiguration;
                  buildSettings = {
                      ALWAYS_SEARCH_USER_PATHS = NO;
                      CLANG_ANALYZER_LOCALIZABILITY_NONLOCALIZED = YES;
                      CLANG_CXX_LANGUAGE_STANDARD = "gnu++0x";
                      CLANG_CXX_LIBRARY = "libc++";
                      CLANG_ENABLE_MODULES = YES;
                      CLANG_ENABLE_OBJC_ARC = YES;
                      CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING = YES;
                      CLANG_WARN_BOOL_CONVERSION = YES;
                      CLANG_WARN_COMMA = YES;
                      CLANG_WARN_CONSTANT_CONVERSION = YES;
                      CLANG_WARN_DEPRECATED_OBJC_IMPLEMENTATIONS = YES;
                      CLANG_WARN_DIRECT_OBJC_ISA_USAGE = YES_ERROR;
                      CLANG_WARN_EMPTY_BODY = YES;
                      CLANG_WARN_ENUM_CONVERSION = YES;
                      CLANG_WARN_INFINITE_RECURSION = YES;
                      CLANG_WARN_INT_CONVERSION = YES;
                      CLANG_WARN_NON_LITERAL_NULL_CONVERSION = YES;
                      CLANG_WARN_OBJC_IMPLICIT_RETAIN_SELF = YES;
                      CLANG_WARN_OBJC_LITERAL_CONVERSION = YES;
                      CLANG_WARN_OBJC_ROOT_CLASS = YES_ERROR;
                      CLANG_WARN_RANGE_LOOP_ANALYSIS = YES;
                      CLANG_WARN_STRICT_PROTOTYPES = YES;
                      CLANG_WARN_SUSPICIOUS_MOVE = YES;
                      CLANG_WARN_UNREACHABLE_CODE = YES;
                      CLANG_WARN__DUPLICATE_METHOD_MATCH = YES;
                      "CODE_SIGN_IDENTITY[sdk=iphoneos*]" = "iPhone Developer";
                      COPY_PHASE_STRIP = NO;
                      ENABLE_STRICT_OBJC_MSGSEND = YES;
                      ENABLE_TESTABILITY = YES;
                      GCC_C_LANGUAGE_STANDARD = gnu99;
                      GCC_DYNAMIC_NO_PIC = NO;
                      GCC_NO_COMMON_BLOCKS = YES;
                      GCC_OPTIMIZATION_LEVEL = 0;
                      GCC_PREPROCESSOR_DEFINITIONS = (
                          "DEBUG=1",
                          "$(inherited)",
                      );
                      GCC_SYMBOLS_PRIVATE_EXTERN = NO;
                      GCC_WARN_64_TO_32_BIT_CONVERSION = YES;
                      GCC_WARN_ABOUT_RETURN_TYPE = YES_ERROR;
                      GCC_WARN_UNDECLARED_SELECTOR = YES;
                      GCC_WARN_UNINITIALIZED_AUTOS = YES_AGGRESSIVE;
                      GCC_WARN_UNUSED_FUNCTION = YES;
                      GCC_WARN_UNUSED_VARIABLE = YES;
                      IPHONEOS_DEPLOYMENT_TARGET = 9.0;
                      LD_RUNPATH_SEARCH_PATHS = "/usr/lib/swift $(inherited)";
                      LIBRARY_SEARCH_PATHS = (
                          "\\"$(TOOLCHAIN_DIR)/usr/lib/swift/$(PLATFORM_NAME)\\"",
                          "\\"$(TOOLCHAIN_DIR)/usr/lib/swift-5.0/$(PLATFORM_NAME)\\"",
                          "\\"$(inherited)\\"",
                      );
                      MTL_ENABLE_DEBUG_INFO = YES;
                      ONLY_ACTIVE_ARCH = YES;
                      SDKROOT = iphoneos;
                  };
                  name = Debug;
              };
              83CBBA211A601CBA00E9B192 /* Release */ = {
                  isa = XCBuildConfiguration;
                  buildSettings = {
                      ALWAYS_SEARCH_USER_PATHS = NO;
                      CLANG_ANALYZER_LOCALIZABILITY_NONLOCALIZED = YES;
                      CLANG_CXX_LANGUAGE_STANDARD = "gnu++0x";
                      CLANG_CXX_LIBRARY = "libc++";
                      CLANG_ENABLE_MODULES = YES;
                      CLANG_ENABLE_OBJC_ARC = YES;
                      CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING = YES;
                      CLANG_WARN_BOOL_CONVERSION = YES;
                      CLANG_WARN_COMMA = YES;
                      CLANG_WARN_CONSTANT_CONVERSION = YES;
                      CLANG_WARN_DEPRECATED_OBJC_IMPLEMENTATIONS = YES;
                      CLANG_WARN_DIRECT_OBJC_ISA_USAGE = YES_ERROR;
                      CLANG_WARN_EMPTY_BODY = YES;
                      CLANG_WARN_ENUM_CONVERSION = YES;
                      CLANG_WARN_INFINITE_RECURSION = YES;
                      CLANG_WARN_INT_CONVERSION = YES;
                      CLANG_WARN_NON_LITERAL_NULL_CONVERSION = YES;
                      CLANG_WARN_OBJC_IMPLICIT_RETAIN_SELF = YES;
                      CLANG_WARN_OBJC_LITERAL_CONVERSION = YES;
                      CLANG_WARN_OBJC_ROOT_CLASS = YES_ERROR;
                      CLANG_WARN_RANGE_LOOP_ANALYSIS = YES;
                      CLANG_WARN_STRICT_PROTOTYPES = YES;
                      CLANG_WARN_SUSPICIOUS_MOVE = YES;
                      CLANG_WARN_UNREACHABLE_CODE = YES;
                      CLANG_WARN__DUPLICATE_METHOD_MATCH = YES;
                      "CODE_SIGN_IDENTITY[sdk=iphoneos*]" = "iPhone Developer";
                      COPY_PHASE_STRIP = YES;
                      ENABLE_NS_ASSERTIONS = NO;
                      ENABLE_STRICT_OBJC_MSGSEND = YES;
                      GCC_C_LANGUAGE_STANDARD = gnu99;
                      GCC_NO_COMMON_BLOCKS = YES;
                      GCC_WARN_64_TO_32_BIT_CONVERSION = YES;
                      GCC_WARN_ABOUT_RETURN_TYPE = YES_ERROR;
                      GCC_WARN_UNDECLARED_SELECTOR = YES;
                      GCC_WARN_UNINITIALIZED_AUTOS = YES_AGGRESSIVE;
                      GCC_WARN_UNUSED_FUNCTION = YES;
                      GCC_WARN_UNUSED_VARIABLE = YES;
                      IPHONEOS_DEPLOYMENT_TARGET = 9.0;
                      LD_RUNPATH_SEARCH_PATHS = "/usr/lib/swift $(inherited)";
                      LIBRARY_SEARCH_PATHS = (
                          "\\"$(TOOLCHAIN_DIR)/usr/lib/swift/$(PLATFORM_NAME)\\"",
                          "\\"$(TOOLCHAIN_DIR)/usr/lib/swift-5.0/$(PLATFORM_NAME)\\"",
                          "\\"$(inherited)\\"",
                      );
                      MTL_ENABLE_DEBUG_INFO = NO;
                      SDKROOT = iphoneos;
                      VALIDATE_PRODUCT = YES;
                  };
                  name = Release;
              };
      /* End XCBuildConfiguration section */
      
      /* Begin XCConfigurationList section */
              00E357021AD99517003FC87E /* Build configuration list for PBXNativeTarget "ReactNativeProjectTests" */ = {
                  isa = XCConfigurationList;
                  buildConfigurations = (
                      00E356F61AD99517003FC87E /* Debug */,
                      00E356F71AD99517003FC87E /* Release */,
                  );
                  defaultConfigurationIsVisible = 0;
                  defaultConfigurationName = Release;
              };
              13B07F931A680F5B00A75B9A /* Build configuration list for PBXNativeTarget "ReactNativeProject" */ = {
                  isa = XCConfigurationList;
                  buildConfigurations = (
                      13B07F941A680F5B00A75B9A /* Debug */,
                      13B07F951A680F5B00A75B9A /* Release */,
                  );
                  defaultConfigurationIsVisible = 0;
                  defaultConfigurationName = Release;
              };
              83CBB9FA1A601CBA00E9B192 /* Build configuration list for PBXProject "ReactNativeProject" */ = {
                  isa = XCConfigurationList;
                  buildConfigurations = (
                      83CBBA201A601CBA00E9B192 /* Debug */,
                      83CBBA211A601CBA00E9B192 /* Release */,
                  );
                  defaultConfigurationIsVisible = 0;
                  defaultConfigurationName = Release;
              };
      /* End XCConfigurationList section */
          };
          rootObject = 83CBB9F71A601CBA00E9B192 /* Project object */;
      }
      `,
  'ios/Podfile.properties.json': `\
  {
    "expo.jsEngine": "jsc"
  }`,
  // Android
  'android/app/src/main/java/com/reactnativeproject/MainActivity.java': `package com.reactnativeproject;
    
    import com.facebook.react.ReactActivity;
    
    public class MainActivity extends ReactActivity {
      /**
       * Returns the name of the main component registered from JavaScript. This is used to schedule
       * rendering of the component.
       */
      @Override
      protected String getMainComponentName() {
        return "react-native-project";
      }
    }
    `,
  'android/app/src/main/java/com/reactnativeproject/MainApplication.java': `package com.reactnativeproject;
    
      import android.app.Application;
      import android.content.Context;
      import android.net.Uri;
      
      import com.facebook.react.PackageList;
      import com.facebook.react.ReactApplication;
      import com.facebook.react.ReactInstanceManager;
      import com.facebook.react.ReactNativeHost;
      import com.facebook.react.ReactPackage;
      import com.facebook.react.shell.MainReactPackage;
      import com.facebook.soloader.SoLoader;
      import com.bacon.mydevicefamilyproject.generated.BasePackageList;
      
      import org.unimodules.adapters.react.ReactAdapterPackage;
      import org.unimodules.adapters.react.ModuleRegistryAdapter;
      import org.unimodules.adapters.react.ReactModuleRegistryProvider;
      import org.unimodules.core.interfaces.Package;
      import org.unimodules.core.interfaces.SingletonModule;
      import expo.modules.constants.ConstantsPackage;
      import expo.modules.permissions.PermissionsPackage;
      import expo.modules.filesystem.FileSystemPackage;
      import expo.modules.updates.UpdatesController;
      
      import java.lang.reflect.InvocationTargetException;
      import java.util.Arrays;
      import java.util.List;
      import javax.annotation.Nullable;
      
      public class MainApplication extends Application implements ReactApplication {
        private final ReactModuleRegistryProvider mModuleRegistryProvider = new ReactModuleRegistryProvider(
          new BasePackageList().getPackageList()
        );
      
        private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
          @Override
          public boolean getUseDeveloperSupport() {
            return BuildConfig.DEBUG;
          }
      
          @Override
          protected List<ReactPackage> getPackages() {
            List<ReactPackage> packages = new PackageList(this).getPackages();
            packages.add(new ModuleRegistryAdapter(mModuleRegistryProvider));
            return packages;
          }
      
          @Override
          protected String getJSMainModuleName() {
            return ".expo/.virtual-metro-entry";
          }
      
          @Override
          protected @Nullable String getJSBundleFile() {
            if (BuildConfig.DEBUG) {
              return super.getJSBundleFile();
            } else {
              return UpdatesController.getInstance().getLaunchAssetFile();
            }
          }
      
          @Override
          protected @Nullable String getBundleAssetName() {
            if (BuildConfig.DEBUG) {
              return super.getBundleAssetName();
            } else {
              return UpdatesController.getInstance().getBundleAssetName();
            }
          }
        };
      
        @Override
        public ReactNativeHost getReactNativeHost() {
          return mReactNativeHost;
        }
      
        @Override
        public void onCreate() {
          super.onCreate();
          SoLoader.init(this, /* native exopackage */ false);
      
          if (!BuildConfig.DEBUG) {
            UpdatesController.initialize(this);
          }
      
          initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
        }
      
        /**
         * Loads Flipper in React Native templates. Call this in the onCreate method with something like
         * initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
         *
         * @param context
         * @param reactInstanceManager
         */
        private static void initializeFlipper(
            Context context, ReactInstanceManager reactInstanceManager) {
          if (BuildConfig.DEBUG) {
            try {
              /*
               We use reflection here to pick up the class that initializes Flipper,
              since Flipper library is not available in release mode
              */
              Class<?> aClass = Class.forName("com.rndiffapp.ReactNativeFlipper");
              aClass
                  .getMethod("initializeFlipper", Context.class, ReactInstanceManager.class)
                  .invoke(null, context, reactInstanceManager);
            } catch (ClassNotFoundException e) {
              e.printStackTrace();
            } catch (NoSuchMethodException e) {
              e.printStackTrace();
            } catch (IllegalAccessException e) {
              e.printStackTrace();
            } catch (InvocationTargetException e) {
              e.printStackTrace();
            }
          }
        }
      }  
    `,
  'android/app/src/main/AndroidManifest.xml': `<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.reactnativeproject">
    
      <uses-permission android:name="android.permission.INTERNET" />
    
      <queries>
        <!-- Support checking for http(s) links via the Linking API -->
        <intent>
          <action android:name="android.intent.action.VIEW" />
          <category android:name="android.intent.category.BROWSABLE" />
          <data android:scheme="https" />
        </intent>
      </queries>
      
      <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:allowBackup="false"
        android:theme="@style/AppTheme">
        <activity
          android:name=".MainActivity"
          android:label="@string/app_name"
          android:configChanges="keyboard|keyboardHidden|orientation|screenSize|uiMode"
          android:launchMode="singleTask"
          android:windowSoftInputMode="adjustResize">
          <intent-filter>
              <action android:name="android.intent.action.MAIN" />
              <category android:name="android.intent.category.LAUNCHER" />
          </intent-filter>
        </activity>
        <activity android:name="com.facebook.react.devsupport.DevSettingsActivity" />
      </application>
    
    </manifest>
    `,
  'android/app/src/main/res/values/styles.xml': `<?xml version="1.0" encoding="utf-8"?>
    <resources>
      <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
        <!-- Customize your theme here. -->
        <item name="android:textColor">#000000</item>
      </style>
    </resources>
    `,
  'android/gradle.properties': `# Project-wide Gradle settings.
    
      # IDE (e.g. Android Studio) users:
      # Gradle settings configured through the IDE *will override*
      # any settings specified in this file.
      
      # For more details on how to configure your build environment visit
      # http://www.gradle.org/docs/current/userguide/build_environment.html
      
      # Specifies the JVM arguments used for the daemon process.
      # The setting is particularly useful for tweaking memory settings.
      # Default value: -Xmx1024m -XX:MaxPermSize=256m
      # org.gradle.jvmargs=-Xmx2048m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8
      
      # When configured, Gradle will run in incubating parallel mode.
      # This option should only be used with decoupled projects. More details, visit
      # http://www.gradle.org/docs/current/userguide/multi_project_builds.html#sec:decoupled_projects
      # org.gradle.parallel=true
      
      # AndroidX package structure to make it clearer which packages are bundled with the
      # Android operating system, and which are packaged with your app's APK
      # https://developer.android.com/topic/libraries/support-library/androidx-rn
      android.useAndroidX=true
      
      # Automatically convert third-party libraries to use AndroidX
      android.enableJetifier=true
      
      # Version of flipper SDK to use with React Native
      FLIPPER_VERSION=0.54.0
      `,

  'android/settings.gradle': `rootProject.name = 'HelloWorld'
    
    apply from: '../node_modules/react-native-unimodules/gradle.groovy'
    includeUnimodulesProjects()
    
    apply from: file("../node_modules/@react-native-community/cli-platform-android/native_modules.gradle");
    applyNativeModulesSettingsGradle(settings)
    
    include ':app'
    `,
  'android/build.gradle': `// Top-level build file where you can add configuration options common to all sub-projects/modules.
    
      buildscript {
          ext {
              buildToolsVersion = "29.0.2"
              minSdkVersion = 21
              compileSdkVersion = 29
              targetSdkVersion = 29
          }
          repositories {
              google()
              jcenter()
          }
          dependencies {
              classpath("com.android.tools.build:gradle:3.5.3")
      
              // NOTE: Do not place your application dependencies here; they belong
              // in the individual module build.gradle files
          }
      }
      
      allprojects {
          repositories {
              mavenLocal()
              maven {
                  // All of React Native (JS, Obj-C sources, Android binaries) is installed from npm
                  url("$rootDir/../node_modules/react-native/android")
              }
              maven {
                  // Android JSC is installed from npm
                  url("$rootDir/../node_modules/jsc-android/dist")
              }
      
              google()
              jcenter()
              maven { url 'https://www.jitpack.io' }
          }
      }`,
  'android/app/build.gradle': `apply plugin: "com.android.application"
    
      import com.android.build.OutputFile
      
      project.ext.react = [
          enableHermes: false
      ]
      
      apply from: '../../node_modules/react-native-unimodules/gradle.groovy'
      apply from: "../../node_modules/react-native/react.gradle"
      apply from: "../../node_modules/expo-updates/scripts/create-manifest-android.gradle"
      
      def enableSeparateBuildPerCPUArchitecture = false
      def enableProguardInReleaseBuilds = false
      def jscFlavor = 'org.webkit:android-jsc:+'
      def enableHermes = project.ext.react.get("enableHermes", false);
      
      android {
          compileSdkVersion rootProject.ext.compileSdkVersion
      
          compileOptions {
              sourceCompatibility JavaVersion.VERSION_1_8
              targetCompatibility JavaVersion.VERSION_1_8
          }
      
          defaultConfig {
              applicationId 'com.bacon.mydevicefamilyproject'
              minSdkVersion rootProject.ext.minSdkVersion
              targetSdkVersion rootProject.ext.targetSdkVersion
              versionCode 1
              versionName "1.0.0"
          }
          splits {
              abi {
                  reset()
                  enable enableSeparateBuildPerCPUArchitecture
                  universalApk false  // If true, also generate a universal APK
                  include "armeabi-v7a", "x86", "arm64-v8a", "x86_64"
              }
          }
          signingConfigs {
              debug {
                  storeFile file('debug.keystore')
                  storePassword 'android'
                  keyAlias 'androiddebugkey'
                  keyPassword 'android'
              }
          }
          buildTypes {
              debug {
                  signingConfig signingConfigs.debug
              }
              release {
                  signingConfig signingConfigs.debug
                  minifyEnabled enableProguardInReleaseBuilds
                  proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
              }
          }
          applicationVariants.all { variant ->
              variant.outputs.each { output ->
                  def versionCodes = ["armeabi-v7a": 1, "x86": 2, "arm64-v8a": 3, "x86_64": 4]
                  def abi = output.getFilter(OutputFile.ABI)
                  if (abi != null) {
                      output.versionCodeOverride =
                              versionCodes.get(abi) * 1048576 + defaultConfig.versionCode
                  }
      
              }
          }
      }
      
      dependencies {
          implementation fileTree(dir: "libs", include: ["*.jar"])
          implementation "com.facebook.react:react-native:+"  // From node_modules
          implementation "androidx.swiperefreshlayout:swiperefreshlayout:1.0.0"
          debugImplementation("com.facebook.flipper:flipper:\${FLIPPER_VERSION}") {
            exclude group:'com.facebook.fbjni'
          }
          debugImplementation("com.facebook.flipper:flipper-network-plugin:\${FLIPPER_VERSION}") {
              exclude group:'com.facebook.flipper'
              exclude group:'com.squareup.okhttp3', module:'okhttp'
          }
          debugImplementation("com.facebook.flipper:flipper-fresco-plugin:\${FLIPPER_VERSION}") {
              exclude group:'com.facebook.flipper'
          }
          addUnimodulesDependencies()
      
          if (enableHermes) {
              def hermesPath = "../../node_modules/hermes-engine/android/";
              debugImplementation files(hermesPath + "hermes-debug.aar")
              releaseImplementation files(hermesPath + "hermes-release.aar")
          } else {
              implementation jscFlavor
          }
      }
      task copyDownloadableDepsToLibs(type: Copy) {
          from configurations.compile
          into 'libs'
      }
      apply from: file("../../node_modules/@react-native-community/cli-platform-android/native_modules.gradle"); applyNativeModulesAppBuildGradle(project)`,
};
