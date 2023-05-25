
# generated from template-files/ios/ExpoKit.podspec


folly_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1'
folly_compiler_flags = folly_flags + ' ' + '-Wno-comma -Wno-shorten-64-to-32'
boost_compiler_flags = '-Wno-documentation'

Pod::Spec.new do |s|
  s.name = "ABI48_0_0ExpoKit"
  s.version = "48.0.0"
  s.summary = 'ExpoKit'
  s.description = 'ExpoKit allows native projects to integrate with the Expo SDK.'
  s.homepage = 'http://docs.expo.io'
  s.license = 'MIT'
  s.author = "650 Industries, Inc."
  s.requires_arc = true
  s.platform = :ios, "13.0"
  s.swift_version  = '5.4'
  s.default_subspec = "Core"
  s.source = { :git => "http://github.com/expo/expo.git" }
  s.xcconfig = {
    'CLANG_CXX_LANGUAGE_STANDARD' => 'gnu++14',
    'SYSTEM_HEADER_SEARCH_PATHS' => "\"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/RCT-Folly\" \"$(PODS_ROOT)/Headers/Private/React-Core\"",
    'OTHER_CPLUSPLUSFLAGS' => [
      "$(OTHER_CFLAGS)",
      "-DFOLLY_NO_CONFIG",
      "-DFOLLY_MOBILE=1",
      "-DFOLLY_USE_LIBCPP=1"
    ]
  }

  s.pod_target_xcconfig = {
    'USE_HEADERMAP' => 'YES',
    'DEFINES_MODULE' => 'YES',
  }


  s.pod_target_xcconfig    = {
    "USE_HEADERMAP"       => "YES",
    "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_TARGET_SRCROOT)\" \"$(PODS_ROOT)/RCT-Folly\" \"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/DoubleConversion\" \"$(PODS_ROOT)/Headers/Private/React-Core\" "
  }
  s.compiler_flags = folly_compiler_flags + ' ' + boost_compiler_flags
  s.xcconfig               = {
    "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/glog\" \"$(PODS_ROOT)/RCT-Folly\" \"$(PODS_ROOT)/Headers/Private/ABI48_0_0React-Core\"",
    "OTHER_CFLAGS"        => "$(inherited)" + " " + folly_flags
  }

  s.subspec "Expo" do |ss|
    ss.source_files     = "Core/**/*.{h,m,mm,cpp}"

    ss.dependency         "ABI48_0_0React-Core"
    ss.dependency         "ABI48_0_0React-Core/DevSupport"
    ss.dependency         "ABI48_0_0ReactCommon"
    ss.dependency         "ABI48_0_0RCTRequired"
    ss.dependency         "ABI48_0_0RCTTypeSafety"
    ss.dependency         "ABI48_0_0React-hermes"
    ss.dependency         "ABI48_0_0ExpoAppleAuthentication"
    ss.dependency         "ABI48_0_0EXApplication"
    ss.dependency         "ABI48_0_0EXAV"
    ss.dependency         "ABI48_0_0EXBackgroundFetch"
    ss.dependency         "ABI48_0_0EXBarCodeScanner"
    ss.dependency         "ABI48_0_0ExpoBattery"
    ss.dependency         "ABI48_0_0ExpoBlur"
    ss.dependency         "EXBranch"
    ss.dependency         "ABI48_0_0ExpoBrightness"
    ss.dependency         "ABI48_0_0EXCalendar"
    ss.dependency         "ABI48_0_0EXCamera"
    ss.dependency         "ABI48_0_0ExpoCellular"
    ss.dependency         "ABI48_0_0ExpoClipboard"
    ss.dependency         "ABI48_0_0EXConstants"
    ss.dependency         "ABI48_0_0EXContacts"
    ss.dependency         "ABI48_0_0ExpoCrypto"
    ss.dependency         "ABI48_0_0ExpoDevice"
    ss.dependency         "ABI48_0_0EXDocumentPicker"
    ss.dependency         "ABI48_0_0EASClient"
    ss.dependency         "ABI48_0_0EXFileSystem"
    ss.dependency         "ABI48_0_0EXFont"
    ss.dependency         "ABI48_0_0ExpoGL"
    ss.dependency         "ABI48_0_0ExpoHaptics"
    ss.dependency         "ABI48_0_0EXImageLoader"
    ss.dependency         "ABI48_0_0ExpoImageManipulator"
    ss.dependency         "ABI48_0_0ExpoImagePicker"
    ss.dependency         "ABI48_0_0ExpoImage"
    ss.dependency         "ABI48_0_0EXJSONUtils"
    ss.dependency         "ABI48_0_0ExpoKeepAwake"
    ss.dependency         "ABI48_0_0ExpoLinearGradient"
    ss.dependency         "ABI48_0_0ExpoLocalAuthentication"
    ss.dependency         "ABI48_0_0ExpoLocalization"
    ss.dependency         "ABI48_0_0EXLocation"
    ss.dependency         "ABI48_0_0ExpoMailComposer"
    ss.dependency         "ABI48_0_0EXManifests"
    ss.dependency         "ABI48_0_0EXMediaLibrary"
    ss.dependency         "ABI48_0_0ExpoModulesCore"
    ss.dependency         "ABI48_0_0ExpoNetwork"
    ss.dependency         "ABI48_0_0EXNotifications"
    ss.dependency         "ABI48_0_0EXPermissions"
    ss.dependency         "ABI48_0_0EXPrint"
    ss.dependency         "ABI48_0_0ExpoRandom"
    ss.dependency         "ABI48_0_0EXScreenCapture"
    ss.dependency         "ABI48_0_0EXScreenOrientation"
    ss.dependency         "ABI48_0_0EXSecureStore"
    ss.dependency         "ABI48_0_0EXSensors"
    ss.dependency         "ABI48_0_0EXSharing"
    ss.dependency         "ABI48_0_0ExpoSMS"
    ss.dependency         "ABI48_0_0EXSpeech"
    ss.dependency         "ABI48_0_0EXSplashScreen"
    ss.dependency         "ABI48_0_0EXSQLite"
    ss.dependency         "ABI48_0_0ExpoStoreReview"
    ss.dependency         "ABI48_0_0EXStructuredHeaders"
    ss.dependency         "ABI48_0_0ExpoSystemUI"
    ss.dependency         "ABI48_0_0EXTaskManager"
    ss.dependency         "ABI48_0_0ExpoTrackingTransparency"
    ss.dependency         "ABI48_0_0EXUpdatesInterface"
    ss.dependency         "ABI48_0_0EXUpdates"
    ss.dependency         "ABI48_0_0ExpoVideoThumbnails"
    ss.dependency         "ABI48_0_0ExpoWebBrowser"
    ss.dependency         "ABI48_0_0Expo"
    ss.dependency         "ABI48_0_0UMAppLoader"
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
    ss.dependency         "ABI48_0_0ExpoModulesProvider"
  end

  s.subspec "ExpoOptional" do |ss|
    ss.dependency         "ABI48_0_0ExpoKit/Expo"
    ss.source_files     = "Optional/**/*.{h,m,mm}"
  end
end
