// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
public class EXDevLauncherURLHelper: NSObject {
  @objc
  public static func isDevLauncherURL(_ url: URL?) -> Bool {
    return url?.host == "expo-development-client"
  }

  @objc
  public static func replaceEXPScheme(_ url: URL, to scheme: String) -> URL {
    var components = URLComponents.init(url: url, resolvingAgainstBaseURL: false)!
    components.scheme = scheme
    return components.url!
  }

  @objc
  public static func getAppURLFromDevLauncherURL(_ url: URL) -> URL? {
    let components = URLComponents.init(url: url, resolvingAgainstBaseURL: false)
    for parameter in components?.queryItems ?? [] {
      if parameter.name == "url" {
        return URL.init(string: parameter.value?.removingPercentEncoding ?? "")
      }
    }

    return nil
  }
}
