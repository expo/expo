
# generated from template-files/ios/ExpoKit.podspec


folly_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1'
folly_compiler_flags = folly_flags + ' ' + '-Wno-comma -Wno-shorten-64-to-32'
boost_compiler_flags = '-Wno-documentation'

Pod::Spec.new do |s|
  s.name = "ABI46_0_0ExpoKit"
  s.version = "46.0.0"
  s.summary = 'ExpoKit'
  s.description = 'ExpoKit allows native projects to integrate with the Expo SDK.'
  s.homepage = 'http://docs.expo.io'
  s.license = 'MIT'
  s.author = "650 Industries, Inc."
  s.requires_arc = true
  s.platform = :ios, "12.0"
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
    "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/glog\" \"$(PODS_ROOT)/RCT-Folly\" \"$(PODS_ROOT)/Headers/Private/ABI46_0_0React-Core\"",
    "OTHER_CFLAGS"        => "$(inherited)" + " " + folly_flags
  }

  s.subspec "Expo" do |ss|
    ss.source_files     = "Core/**/*.{h,m,mm,cpp}"

    ss.dependency         "ABI46_0_0React-Core"
    ss.dependency         "ABI46_0_0React-Core/DevSupport"
    ss.dependency         "ABI46_0_0ReactCommon"
    ss.dependency         "ABI46_0_0RCTRequired"
    ss.dependency         "ABI46_0_0RCTTypeSafety"
    ss.dependency         "ABI46_0_0EXAppleAuthentication"
    ss.dependency         "ABI46_0_0EXApplication"
    ss.dependency         "ABI46_0_0EXAV"
    ss.dependency         "ABI46_0_0EXBackgroundFetch"
    ss.dependency         "ABI46_0_0EXBarCodeScanner"
    ss.dependency         "ABI46_0_0EXBattery"
    ss.dependency         "ABI46_0_0EXBlur"
    ss.dependency         "EXBranch"
    ss.dependency         "ABI46_0_0EXBrightness"
    ss.dependency         "ABI46_0_0EXCalendar"
    ss.dependency         "ABI46_0_0EXCamera"
    ss.dependency         "ABI46_0_0ExpoCellular"
    ss.dependency         "ABI46_0_0ExpoClipboard"
    ss.dependency         "ABI46_0_0EXConstants"
    ss.dependency         "ABI46_0_0EXContacts"
    ss.dependency         "ABI46_0_0ExpoCrypto"
    ss.dependency         "ABI46_0_0EXDevice"
    ss.dependency         "ABI46_0_0EXDocumentPicker"
    ss.dependency         "ABI46_0_0EASClient"
    ss.dependency         "ABI46_0_0EXErrorRecovery"
    ss.dependency         "ABI46_0_0EXFileSystem"
    ss.dependency         "ABI46_0_0EXFirebaseAnalytics"
    ss.dependency         "ABI46_0_0EXFirebaseCore"
    ss.dependency         "ABI46_0_0EXFont"
    ss.dependency         "ABI46_0_0EXGL_CPP"
    ss.dependency         "ABI46_0_0EXGL"
    ss.dependency         "ABI46_0_0ExpoHaptics"
    ss.dependency         "ABI46_0_0EXImageLoader"
    ss.dependency         "ABI46_0_0ExpoImageManipulator"
    ss.dependency         "ABI46_0_0ExpoImagePicker"
    ss.dependency         "ABI46_0_0EXJSONUtils"
    ss.dependency         "ABI46_0_0ExpoKeepAwake"
    ss.dependency         "ABI46_0_0ExpoLinearGradient"
    ss.dependency         "ABI46_0_0EXLocalAuthentication"
    ss.dependency         "ABI46_0_0ExpoLocalization"
    ss.dependency         "ABI46_0_0EXLocation"
    ss.dependency         "ABI46_0_0ExpoMailComposer"
    ss.dependency         "ABI46_0_0EXManifests"
    ss.dependency         "ABI46_0_0EXMediaLibrary"
    ss.dependency         "ABI46_0_0ExpoModulesCore"
    ss.dependency         "ABI46_0_0EXNetwork"
    ss.dependency         "ABI46_0_0EXNotifications"
    ss.dependency         "ABI46_0_0EXPermissions"
    ss.dependency         "ABI46_0_0EXPrint"
    ss.dependency         "ABI46_0_0ExpoRandom"
    ss.dependency         "ABI46_0_0EXScreenCapture"
    ss.dependency         "ABI46_0_0EXScreenOrientation"
    ss.dependency         "ABI46_0_0EXSecureStore"
    ss.dependency         "ABI46_0_0EXSensors"
    ss.dependency         "ABI46_0_0EXSharing"
    ss.dependency         "ABI46_0_0EXSMS"
    ss.dependency         "ABI46_0_0EXSpeech"
    ss.dependency         "ABI46_0_0EXSplashScreen"
    ss.dependency         "ABI46_0_0EXSQLite"
    ss.dependency         "ABI46_0_0EXStoreReview"
    ss.dependency         "ABI46_0_0EXStructuredHeaders"
    ss.dependency         "ABI46_0_0ExpoSystemUI"
    ss.dependency         "ABI46_0_0EXTaskManager"
    ss.dependency         "ABI46_0_0ExpoTrackingTransparency"
    ss.dependency         "ABI46_0_0EXUpdatesInterface"
    ss.dependency         "ABI46_0_0EXUpdates"
    ss.dependency         "ABI46_0_0EXVideoThumbnails"
    ss.dependency         "ABI46_0_0ExpoWebBrowser"
    ss.dependency         "ABI46_0_0Expo"
    ss.dependency         "ABI46_0_0UMAppLoader"
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
    ss.dependency         "RCT-Folly"
    ss.dependency         "ABI46_0_0ExpoModulesProvider"
  end

  s.subspec "ExpoOptional" do |ss|
    ss.dependency         "ABI46_0_0ExpoKit/Expo"
    ss.source_files     = "Optional/**/*.{h,m,mm}"
  end
end
