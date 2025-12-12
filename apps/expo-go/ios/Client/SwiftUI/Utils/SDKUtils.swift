// Copyright 2015-present 650 Industries. All rights reserved.

func getSupportedSDKVersion() -> String {
  let versions = EXVersions.sharedInstance()
  return EXVersions.sharedInstance().sdkVersion
}

func getSDKMajorVersion(_ sdkVersion: String) -> String {
  return sdkVersion.components(separatedBy: ".").first ?? sdkVersion
}
