// Copyright 2015-present 650 Industries. All rights reserved.

import React

class DevMenuDevOptionsDelegate {
  internal private(set) weak var bridge: RCTBridge?
  internal private(set) weak var devSettings: RCTDevSettings?

  #if DEBUG
  internal private(set) weak var perfMonitor: NSObject?
  #endif

  internal init(forBridge bridge: RCTBridge) {
    self.bridge = bridge
    devSettings = bridge.module(forName: "DevSettings") as? RCTDevSettings

    #if DEBUG
    perfMonitor = bridge.module(forName: "PerfMonitor") as? NSObject
    #endif
  }

  internal func reload() {
    // Without this the `expo-splash-screen` will reject
    // No native splash screen registered for given view controller. Call 'SplashScreen.show' for given view controller first.
    DevMenuManager.shared.hideMenu()

    DispatchQueue.main.async {
      RCTTriggerReloadCommandListeners("Dev menu - reload")
    }
  }

  internal func toggleElementInsector() {
    devSettings?.toggleElementInspector()
  }

  internal func openJSInspector() {
    guard let bundleURL = bridge?.bundleURL else {
      return
    }
    let port = bundleURL.port ?? Int(RCT_METRO_PORT)
    let host = bundleURL.host ?? "localhost"
    let openURL = "http://\(host):\(port)/_expo/debugger?applicationId=\(Bundle.main.bundleIdentifier ?? "")"
    guard let url = URL(string: openURL) else {
      NSLog("[DevMenu] Invalid openJSInspector URL: $@", openURL)
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
