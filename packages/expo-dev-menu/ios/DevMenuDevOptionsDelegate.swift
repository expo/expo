// Copyright 2015-present 650 Industries. All rights reserved.

import React
import ExpoModulesCore

class DevMenuDevOptionsDelegate {
  internal private(set) weak var appContext: AppContext?
  internal private(set) weak var devSettings: RCTDevSettings?

  #if DEBUG
  internal private(set) weak var perfMonitor: NSObject?
  #endif

  internal init(forAppContext appContext: AppContext) {
    self.appContext = appContext
    devSettings = appContext.nativeModule(named: "DevSettings")

    #if DEBUG && !os(macOS)
    perfMonitor = appContext.nativeModule(named: "PerfMonitor")
    #endif
  }

  internal func reload() {
    // Without this the `expo-splash-screen` will reject
    // No native splash screen registered for given view controller. Call 'SplashScreen.show' for given view controller first.
    DevMenuManager.shared.hideMenu()
    appContext?.reloadAppAsync()
  }

  internal func toggleElementInsector() {
    devSettings?.toggleElementInspector()
  }

  internal func openJSInspector() {
    guard let bundleURL = appContext?.bundleURL else {
      return
    }
    let isServed = bundleURL.scheme == "http" || bundleURL.scheme == "https" || bundleURL.scheme == "exps" || bundleURL.scheme == "exp"
    var components = URLComponents()
    components.scheme = bundleURL.scheme == "https" || bundleURL.scheme == "exps" ? "https" : "http"
    components.host = isServed ? bundleURL.host : "localhost"
    components.port = isServed ? bundleURL.port : Int(RCT_METRO_PORT)
    components.path = "/_expo/debugger"
    components.queryItems = [
      URLQueryItem(name: "applicationId", value: Bundle.main.bundleIdentifier ?? "")
    ]
    guard let url = components.url else {
      NSLog("[DevMenu] Invalid openJSInspector URL: $@", components.description)
      return
    }
    let request = NSMutableURLRequest(url: url)
    request.httpMethod = "PUT"
    URLSession.shared.dataTask(with: request as URLRequest).resume()
  }

  internal func togglePerformanceMonitor() {
    #if DEBUG
    guard let perfMonitor, let devSettings else {
      return
    }

    DispatchQueue.main.async {
      let hide = NSSelectorFromString("hide")
      let show = NSSelectorFromString("show")

      if devSettings.isPerfMonitorShown {
        if perfMonitor.responds(to: hide) {
          perfMonitor.perform(hide)
        }
      } else {
        let devMenuManager = DevMenuManager.shared
        let devMenuWindow = devMenuManager.window
        let menuWasVisible = devMenuManager.isVisible

        if menuWasVisible {
          devMenuWindow?.isHidden = true
        }

        if perfMonitor.responds(to: show) {
          perfMonitor.perform(show)
        }

        if menuWasVisible {
          devMenuWindow?.isHidden = false
        }
      }
      devSettings.isPerfMonitorShown = !devSettings.isPerfMonitorShown
    }
    #endif
  }

  internal func toggleFastRefresh() {
    guard let devSettings = devSettings else {
      return
    }

    devSettings.isHotLoadingEnabled = !devSettings.isHotLoadingEnabled
  }
}
