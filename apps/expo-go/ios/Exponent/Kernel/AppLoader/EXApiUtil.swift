// Copyright 2015-present 650 Industries. All rights reserved.

import EXManifests

@objc(EXApiUtil)
@objcMembers
public class ApiUtil: NSObject {
  public static func bundleUrlFromManifest(_ manifest: Manifest) -> URL? {
    return bundleUrlFromManifest(manifest, relativeTo: nil)
  }

  public static func bundleUrlFromManifest(_ manifest: Manifest, relativeTo manifestUrl: URL?) -> URL? {
    return self.encodedUrlFromString(manifest.bundleUrl(), relativeTo: manifestUrl)
  }

  public static func encodedUrlFromString(_ urlString: String) -> URL? {
    return encodedUrlFromString(urlString, relativeTo: nil)
  }

  public static func encodedUrlFromString(_ urlString: String, relativeTo baseUrl: URL?) -> URL? {
    let encodedUrlString = urlString.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
    if let baseUrl = baseUrl {
      return URL(string: urlString, relativeTo: baseUrl)?.absoluteURL
        ?? URL(string: encodedUrlString, relativeTo: baseUrl)?.absoluteURL
    }
    return URL(string: urlString) ?? URL(string: encodedUrlString)
  }
}
