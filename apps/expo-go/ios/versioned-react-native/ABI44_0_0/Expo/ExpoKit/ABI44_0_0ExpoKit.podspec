
# generated from template-files/ios/ExpoKit.podspec


folly_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1'
folly_compiler_flags = folly_flags + ' ' + '-Wno-comma -Wno-shorten-64-to-32'
boost_compiler_flags = '-Wno-documentation'

Pod::Spec.new do |s|
  s.name = "ABI44_0_0ExpoKit"
  s.version = "44.0.0"
  s.summary = 'ExpoKit'
  s.description = 'ExpoKit allows native projects to integrate with the Expo SDK.'
  s.homepage = 'http://docs.expo.io'
  s.license = 'MIT'
  s.author = "650 Industries, Inc."
  s.requires_arc = true
  s.platform = :ios, "12.0"
  s.default_subspec = "Core"
  s.source = { :git => "http://github.com/expo/expo.git" }
  s.xcconfig = {
    'CLANG_CXX_LANGUAGE_STANDARD' => 'gnu++14',
    'SYSTEM_HEADER_SEARCH_PATHS' => "\"$(PODS_ROOT)/boost-for-react-native\" \"$(PODS_ROOT)/Folly\" \"$(PODS_ROOT)/Headers/Private/React-Core\"",
    'OTHER_CPLUSPLUSFLAGS' => [
      "$(OTHER_CFLAGS)",
      "-DFOLLY_NO_CONFIG",
      "-DFOLLY_MOBILE=1",
      "-DFOLLY_USE_LIBCPP=1"
    ]
  }


  s.pod_target_xcconfig    = {
    "USE_HEADERMAP"       => "YES",
    "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_TARGET_SRCROOT)\" \"$(PODS_ROOT)/RCT-Folly\" \"$(PODS_ROOT)/boost-for-react-native\" \"$(PODS_ROOT)/DoubleConversion\" \"$(PODS_ROOT)/Headers/Private/React-Core\" "
  }
  s.compiler_flags = folly_compiler_flags + ' ' + boost_compiler_flags
  s.xcconfig               = {
    "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost-for-react-native\" \"$(PODS_ROOT)/glog\" \"$(PODS_ROOT)/RCT-Folly\" \"$(PODS_ROOT)/Headers/Private/ABI44_0_0React-Core\"",
    "OTHER_CFLAGS"        => "$(inherited)" + " " + folly_flags
  }

  s.subspec "Expo" do |ss|
    ss.source_files     = "Core/**/*.{h,m,mm,cpp}"

    ss.dependency         "ABI44_0_0React-Core"
    ss.dependency         "ABI44_0_0React-Core/DevSupport"
    ss.dependency         "ABI44_0_0ReactCommon"
    ss.dependency         "ABI44_0_0EXAdsAdMob"
    ss.dependency         "ABI44_0_0EXAdsFacebook"
    ss.dependency         "ABI44_0_0EXAmplitude"
    ss.dependency         "ABI44_0_0EXSegment"
    ss.dependency         "ABI44_0_0EXAppAuth"
    ss.dependency         "ABI44_0_0EXAppleAuthentication"
    ss.dependency         "ABI44_0_0EXApplication"
    ss.dependency         "ABI44_0_0EXAV"
    ss.dependency         "ABI44_0_0EXBackgroundFetch"
    ss.dependency         "ABI44_0_0EXBarCodeScanner"
    ss.dependency         "ABI44_0_0EXBattery"
    ss.dependency         "ABI44_0_0EXBlur"
    ss.dependency         "EXBranch"
    ss.dependency         "ABI44_0_0EXBrightness"
    ss.dependency         "ABI44_0_0EXCalendar"
    ss.dependency         "ABI44_0_0EXCamera"
    ss.dependency         "ABI44_0_0ExpoCellular"
    ss.dependency         "ABI44_0_0EXClipboard"
    ss.dependency         "ABI44_0_0EXConstants"
    ss.dependency         "ABI44_0_0EXContacts"
    ss.dependency         "ABI44_0_0EXCrypto"
    ss.dependency         "ABI44_0_0EXDevice"
    ss.dependency         "ABI44_0_0EXDocumentPicker"
    ss.dependency         "ABI44_0_0EXErrorRecovery"
    ss.dependency         "ABI44_0_0EXFaceDetector"
    ss.dependency         "ABI44_0_0EXFacebook"
    ss.dependency         "ABI44_0_0EXFileSystem"
    ss.dependency         "ABI44_0_0EXFirebaseAnalytics"
    ss.dependency         "ABI44_0_0EXFirebaseCore"
    ss.dependency         "ABI44_0_0EXFont"
    ss.dependency         "EXGL_CPP"
    ss.dependency         "ABI44_0_0EXGL"
    ss.dependency         "ABI44_0_0EXGoogleSignIn"
    ss.dependency         "ABI44_0_0ExpoHaptics"
    ss.dependency         "ABI44_0_0EXImageLoader"
    ss.dependency         "ABI44_0_0EXImageManipulator"
    ss.dependency         "ABI44_0_0EXImagePicker"
    ss.dependency         "ABI44_0_0EXJSONUtils"
    ss.dependency         "ABI44_0_0EXKeepAwake"
    ss.dependency         "ABI44_0_0ExpoLinearGradient"
    ss.dependency         "ABI44_0_0EXLocalAuthentication"
    ss.dependency         "ABI44_0_0ExpoLocalization"
    ss.dependency         "ABI44_0_0EXLocation"
    ss.dependency         "ABI44_0_0EXMailComposer"
    ss.dependency         "ABI44_0_0EXManifests"
    ss.dependency         "ABI44_0_0EXMediaLibrary"
    ss.dependency         "ABI44_0_0ExpoModulesCore"
    ss.dependency         "ABI44_0_0EXNetwork"
    ss.dependency         "ABI44_0_0EXNotifications"
    ss.dependency         "ABI44_0_0EXPermissions"
    ss.dependency         "ABI44_0_0EXPrint"
    ss.dependency         "ABI44_0_0EXRandom"
    ss.dependency         "ABI44_0_0EXScreenCapture"
    ss.dependency         "ABI44_0_0EXScreenOrientation"
    ss.dependency         "ABI44_0_0EXSecureStore"
    ss.dependency         "ABI44_0_0EXSensors"
    ss.dependency         "ABI44_0_0EXSharing"
    ss.dependency         "ABI44_0_0EXSMS"
    ss.dependency         "ABI44_0_0EXSpeech"
    ss.dependency         "ABI44_0_0EXSplashScreen"
    ss.dependency         "ABI44_0_0EXSQLite"
    ss.dependency         "ABI44_0_0EXStoreReview"
    ss.dependency         "ABI44_0_0EXStructuredHeaders"
    ss.dependency         "ABI44_0_0ExpoSystemUI"
    ss.dependency         "ABI44_0_0EXTaskManager"
    ss.dependency         "ABI44_0_0EXTrackingTransparency"
    ss.dependency         "ABI44_0_0EXUpdatesInterface"
    ss.dependency         "ABI44_0_0EXUpdates"
    ss.dependency         "ABI44_0_0EXVideoThumbnails"
    ss.dependency         "ABI44_0_0EXWebBrowser"
    ss.dependency         "ABI44_0_0Expo"
    ss.dependency         "ABI44_0_0UMAppLoader"
    ss.dependency         "ABI44_0_0UMTaskManagerInterface"
    ss.dependency         "Amplitude"
    ss.dependency         "Analytics"
    ss.dependency         "AppAuth"
    ss.dependency         "FBAudienceNetwork"
    ss.dependency         "FBSDKCoreKit"
    ss.dependency         "GoogleSignIn"
    ss.dependency         "GoogleMaps"
    ss.dependency         "Google-Maps-iOS-Utils"
    ss.dependency         "lottie-ios"
    ss.dependency         "JKBigInteger"
    ss.dependency         "Branch"
    ss.dependency         "Google-Mobile-Ads-SDK"
    ss.dependency         "RCT-Folly"
    ss.dependency         "ABI44_0_0ExpoModulesProvider"
  end

  s.subspec "ExpoOptional" do |ss|
    ss.dependency         "ABI44_0_0ExpoKit/Expo"
    ss.source_files     = "Optional/**/*.{h,m,mm}"
  end
end
