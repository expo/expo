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
  public var initialUrl: URL?

  @objc
  public init(_ url: URL) {
    self.queryParams = EXDevLauncherURLHelper.getQueryParamsForUrl(url)
    let initialUrlParam = queryParams["initialUrl"] ?? queryParams["initialURL"]
    if let initialUrlParam, !initialUrlParam.isEmpty {
      self.initialUrl = URL(string: initialUrlParam)
    }

    if EXDevLauncherURLHelper.isDevLauncherURL(url),
      let urlParam = queryParams["url"],
      let urlFromParam = URL(string: urlParam) {
      self.url = EXDevLauncherURLHelper.replaceEXPScheme(urlFromParam, to: "http")
    } else {
      self.url = EXDevLauncherURLHelper.replaceEXPScheme(url, to: "http")
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
    guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
    let queryItems = components.queryItems else {
      return false
    }

    return queryItems.contains { $0.name == "url" && $0.value != nil }
  }

  @objc
  public static func disableOnboardingPopupIfNeeded(_ url: URL) {
    guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
    let queryItems = components.queryItems else {
      return
    }

    let shouldDisable = queryItems.contains {
      $0.name == "disableOnboarding" && ($0.value ?? "") == "1"
    }

    if shouldDisable {
      DevMenuPreferences.isOnboardingFinished = true
    }
  }

  @objc
  public static func replaceEXPScheme(_ url: URL, to scheme: String) -> URL {
    guard var components = URLComponents(url: url, resolvingAgainstBaseURL: false),
    components.scheme == "exp" else {
      return url
    }

    components.scheme = scheme
    return components.url ?? url
  }

  // Expo CLI's manifest endpoint only accepts `ios`/`android`/`web`, so on
  // platforms like `macos` we ask it for `ios` and rewrite the `platform`
  // query param on the bundle URL it returns to match the actual runtime.
  @objc
  public static func bundleURL(_ bundleURL: URL, withResolvedPlatform platform: String) -> URL {
    guard !bundleURL.isFileURL,
          var components = URLComponents(url: bundleURL, resolvingAgainstBaseURL: false),
          var queryItems = components.queryItems else {
      return bundleURL
    }
    var didReplace = false
    for i in queryItems.indices where queryItems[i].name == "platform" {
      queryItems[i] = URLQueryItem(name: "platform", value: platform)
      didReplace = true
    }
    guard didReplace else {
      return bundleURL
    }
    components.queryItems = queryItems
    return components.url ?? bundleURL
  }

  @objc
  public static func getQueryParamsForUrl(_ url: URL) -> [String: String] {
    guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
    let queryItems = components.queryItems else {
      return [:]
    }

    var params: [String: String] = [:]
    for item in queryItems {
      params[item.name] = item.value?.removingPercentEncoding ?? ""
    }

    return params
  }
}
