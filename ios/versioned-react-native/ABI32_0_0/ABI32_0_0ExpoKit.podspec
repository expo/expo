
# generated from template-files/ios/ExpoKit.podspec

Pod::Spec.new do |s|
  s.name = "ABI32_0_0ExpoKit"
  s.version = "32.0.0"
  s.summary = 'ExpoKit'
  s.description = 'ExpoKit allows native projects to integrate with the Expo SDK.'
  s.homepage = 'http://docs.expo.io'
  s.license = 'MIT'
  s.author = "650 Industries, Inc."
  s.requires_arc = true
  s.platform = :ios, "10.0"
  s.default_subspec = "Core"
  s.source = { :git => "http://github.com/expo/expo.git" }

  s.subspec "Expo" do |ss|
    ss.dependency         "ReactABI32_0_0/Core"
    ss.dependency         "ABI32_0_0EXAdsAdMob"
    ss.dependency         "ABI32_0_0EXAppAuth"
    ss.dependency         "ABI32_0_0EXAppLoaderProvider"
    ss.dependency         "ABI32_0_0EXBackgroundFetch"
    ss.dependency         "ABI32_0_0EXBarCodeScanner"
    ss.dependency         "ABI32_0_0EXBarCodeScannerInterface"
    ss.dependency         "ABI32_0_0EXCamera"
    ss.dependency         "ABI32_0_0EXCameraInterface"
    ss.dependency         "ABI32_0_0EXConstants"
    ss.dependency         "ABI32_0_0EXConstantsInterface"
    ss.dependency         "ABI32_0_0EXContacts"
    ss.dependency         "ABI32_0_0EXCore"
    ss.dependency         "ABI32_0_0EXErrors"
    ss.dependency         "ABI32_0_0EXFaceDetector"
    ss.dependency         "ABI32_0_0EXFaceDetectorInterface"
    ss.dependency         "ABI32_0_0EXFileSystem"
    ss.dependency         "ABI32_0_0EXFileSystemInterface"
    ss.dependency         "ABI32_0_0EXFont"
    ss.dependency         "ABI32_0_0EXFontInterface"
    ss.dependency         "ABI32_0_0EXGoogleSignIn"
    ss.dependency         "ABI32_0_0EXGL"
    ss.dependency         "EXGL-CPP"
    ss.dependency         "ABI32_0_0EXImageLoaderInterface"
    ss.dependency         "ABI32_0_0EXLocalAuthentication"
    ss.dependency         "ABI32_0_0EXLocalization"
    ss.dependency         "ABI32_0_0EXLocation"
    ss.dependency         "ABI32_0_0EXMediaLibrary"
    ss.dependency         "ABI32_0_0EXPermissions"
    ss.dependency         "ABI32_0_0EXPermissionsInterface"
    ss.dependency         "ABI32_0_0EXPrint"
    ss.dependency         "ABI32_0_0EXReactNativeAdapter"
    ss.dependency         "ABI32_0_0EXSegment"
    ss.dependency         "ABI32_0_0EXSensors"
    ss.dependency         "ABI32_0_0EXSensorsInterface"
    ss.dependency         "ABI32_0_0EXSMS"
    ss.dependency         "ABI32_0_0EXTaskManager"
    ss.dependency         "ABI32_0_0EXTaskManagerInterface"
    ss.dependency         "Amplitude-iOS"
    ss.dependency         "Analytics"
    ss.dependency         "AppAuth"
    ss.dependency         "FBAudienceNetwork"
    ss.dependency         "FBSDKCoreKit"
    ss.dependency         "FBSDKLoginKit"
    ss.dependency         "GoogleSignIn"
    ss.dependency         "GoogleMaps"
    ss.dependency         "Google-Maps-iOS-Utils"
    ss.dependency         "lottie-ios"
    ss.dependency         "JKBigInteger2"
    ss.dependency         "Branch"
    ss.dependency         "Google-Mobile-Ads-SDK"
    ss.source_files     = "Expo/Core/**/*.{h,m}"
  end

  s.subspec "ExpoOptional" do |ss|
    ss.dependency         "ABI32_0_0ExpoKit/Expo"
    ss.source_files     = "Expo/Optional/**/*.{h,m}"
  end
end
