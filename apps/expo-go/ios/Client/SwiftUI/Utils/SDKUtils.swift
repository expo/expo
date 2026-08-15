// Copyright 2015-present 650 Industries. All rights reserved.

func getSupportedSDKVersion() -> String {
  return Versions.sharedInstance.sdkVersion
}

func getSDKMajorVersion(_ sdkVersion: String) -> String {
  return Versions.majorVersion(from: sdkVersion)
}

func isSDKCompatible(_ sdkVersion: String?) -> Bool {
  return Versions.sharedInstance.isCompatible(sdkVersion: sdkVersion)
}
