// Copyright 2015-present 650 Industries. All rights reserved.

func getSupportedSDKVersion() -> String {
  return EXVersions.sharedInstance().sdkVersion
}

func getSDKMajorVersion(_ sdkVersion: String) -> String {
  return sdkVersion.components(separatedBy: ".").first ?? sdkVersion
}

func isSDKCompatible(_ sdkVersion: String?) -> Bool {
  guard let sdkVersion = sdkVersion else { return false }
  let supportedSDK = getSupportedSDKVersion()
  return getSDKMajorVersion(sdkVersion) == getSDKMajorVersion(supportedSDK)
}
