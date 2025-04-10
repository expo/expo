// Copyright 2015-present 650 Industries. All rights reserved.

import EXManifests

@objc(EXApiUtil)
@objcMembers
public class ApiUtil: NSObject {
  public static func bundleUrlFromManifest(_ manifest: Manifest) -> URL? {
    return self.encodedUrlFromString(manifest.bundleUrl())
  }

  public static func encodedUrlFromString(_ urlString: String) -> URL? {
    return URL(string: urlString) ?? URL(string: urlString.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")
  }
}
