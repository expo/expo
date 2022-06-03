  // Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
public class EXDevLauncherUrl: NSObject {
  @objc
  public var url: URL
  
  @objc
  public var queryParams: [String: String]
  
  @objc
  public init(_ url: URL) {
    self.queryParams = EXDevLauncherURLHelper.getQueryParamsForUrl(url)
    self.url = url
    
    if (EXDevLauncherURLHelper.isDevLauncherURL(url)) {
      if let urlParam = self.queryParams["url"] {
        if let urlFromParam = URL.init(string: urlParam) {
          self.url = EXDevLauncherURLHelper.replaceEXPScheme(urlFromParam, to: "http")
        }
      }
    }
    
    super.init()
  }
}

@objc
public class EXDevLauncherURLHelper: NSObject {
  @objc
  public static func isDevLauncherURL(_ url: URL?) -> Bool {
    guard let url = url else {
      return false
    }

    let hostIsMatching = url.host == "expo-development-client"
    var hasUrlQueryParam = false
    
    let components = URLComponents.init(url: url, resolvingAgainstBaseURL: false)
    
    for queryItem in components?.queryItems ?? [] {
      if queryItem.name == "url" && queryItem.value != nil {
        hasUrlQueryParam = true
        break
      }
    }
    
    let isDevLauncherURL = hostIsMatching && hasUrlQueryParam
    return isDevLauncherURL
  }

  @objc
  public static func replaceEXPScheme(_ url: URL, to scheme: String) -> URL {
    var components = URLComponents.init(url: url, resolvingAgainstBaseURL: false)!
    if (components.scheme == "exp") {
      components.scheme = scheme
    }
    return components.url!
  }
  
  @objc
  public static func getQueryParamsForUrl(_ url: URL) -> [String: String] {
    let components = URLComponents.init(url: url, resolvingAgainstBaseURL: false)
    var dict: [String: String] = [:]
    
    for parameter in components?.queryItems ?? [] {
      dict[parameter.name] = parameter.value?.removingPercentEncoding ?? ""
    }
  
    return dict
  }
}
