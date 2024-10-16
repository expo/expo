// Copyright 2015-present 650 Industries. All rights reserved.

import EXManifests

@objc(EXVersions)
@objcMembers
public class Versions: NSObject {
  public static let sharedInstance = Versions()

  public let sdkVersion = BuildConstants.sharedInstance.sdkVersion

  public func availableSdkVersion(forManifest manifest: Manifest?) -> String {
    return manifest?.expoGoSDKVersion() == sdkVersion ? sdkVersion : ""
  }

  public func supportsVersion(_ sdkVersion: String) -> Bool {
    return self.sdkVersion == sdkVersion
  }
}
