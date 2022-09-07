  // Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import EXDevMenu

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
    } else {
      self.url = EXDevLauncherURLHelper.replaceEXPScheme(self.url, to: "http")
    }
    
    super.init()
  }
}

@objc
public class EXDevLauncherURLHelper: NSObject {
  @objc
  public static func isDevLauncherURL(_ url: URL?) -> Bool {
    return url?.host == "expo-development-client"
  }
  
  @objc
  public static func hasUrlQueryParam(_ url: URL) -> Bool {
    var hasUrlQueryParam = false
    
    let components = URLComponents.init(url: url, resolvingAgainstBaseURL: false)
    
    for queryItem in components?.queryItems ?? [] {
      if queryItem.name == "url" && queryItem.value != nil {
        hasUrlQueryParam = true
        break
      }
    }
    
    return hasUrlQueryParam
  }

  @objc
  public static func disableOnboardingPopupIfNeeded(_ url: URL) {
    let components = URLComponents.init(url: url, resolvingAgainstBaseURL: false)

    for queryItem in components?.queryItems ?? [] {
      if queryItem.name == "disableOnboarding" && queryItem.value != nil {
        DevMenuPreferences.isOnboardingFinished = true
        break
      }
    }
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
