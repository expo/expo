// Copyright 2015-present 650 Industries. All rights reserved.

import EXDevMenuInterface

@objc(DevMenuExtensions)
open class DevMenuExtensions: NSObject, RCTBridgeModule, DevMenuExtensionProtocol {
  // MARK: RCTBridgeModule

  @objc
  public static func moduleName() -> String! {
    return "ExpoDevMenuExtensions"
  }

  @objc
  public static func requiresMainQueueSetup() -> Bool {
    return true
  }

  @objc
  open var bridge: RCTBridge?

  // MARK: DevMenuExtensionProtocol

  @objc
  open func devMenuItems() -> [DevMenuItem]? {
    guard let devSettings = bridge?.module(forName: "DevSettings") as? RCTDevSettings else {
      return nil
    }

    let reload = DevMenuExtensions.reloadAction {
      self.bridge?.requestReload()
    }

    let inspector = DevMenuExtensions.elementInspectorAction {
      devSettings.toggleElementInspector()
    }
    inspector.isEnabled = { devSettings.isElementInspectorShown }

    #if DEBUG
    let remoteDebug = DevMenuExtensions.remoteDebugAction {
      DispatchQueue.main.async {
        devSettings.isDebuggingRemotely = !devSettings.isDebuggingRemotely
      }
    }
    remoteDebug.isAvailable = { devSettings.isRemoteDebuggingAvailable }
    remoteDebug.isEnabled = { devSettings.isDebuggingRemotely }

    let fastRefresh = DevMenuExtensions.fastRefreshAction {
      devSettings.isHotLoadingEnabled = !devSettings.isHotLoadingEnabled
    }
    fastRefresh.isAvailable = { devSettings.isHotLoadingAvailable }
    fastRefresh.isEnabled = { devSettings.isHotLoadingEnabled }

    let perfMonitor = DevMenuExtensions.performanceMonitorAction {
      if let perfMonitorModule = self.bridge?.module(forName: "PerfMonitor") as? RCTPerfMonitor {
        DispatchQueue.main.async {
          devSettings.isPerfMonitorShown ? perfMonitorModule.hide() : perfMonitorModule.show()
          devSettings.isPerfMonitorShown = !devSettings.isPerfMonitorShown
        }
      }
    }
    perfMonitor.isAvailable = { self.bridge?.module(forName: "PerfMonitor") != nil }
    perfMonitor.isEnabled = { devSettings.isPerfMonitorShown }

    return [reload, inspector, remoteDebug, fastRefresh, perfMonitor]
    #else
    return [reload, inspector]
    #endif
  }

  // MARK: static helpers

  public static func reloadAction(action: @escaping () -> ()) -> DevMenuAction {
    let reload = DevMenuAction(withId: "reload", action: action)
    reload.label = { "Reload" }
    reload.glyphName = { "reload" }
    reload.importance = DevMenuItem.ImportanceHighest
    reload.registerKeyCommand(input: "r", modifiers: .command)
    return reload
  }

  public static func elementInspectorAction(_ action: @escaping () -> ()) -> DevMenuAction {
    let inspector = DevMenuAction(withId: "inspector", action: action)
    inspector.label = { inspector.isEnabled() ? "Hide Element Inspector" : "Show Element Inspector" }
    inspector.glyphName = { "border-style" }
    inspector.importance = DevMenuItem.ImportanceHigh
    inspector.registerKeyCommand(input: "i", modifiers: .command)
    return inspector
  }

  public static func remoteDebugAction(_ action: @escaping () -> ()) -> DevMenuAction {
    let remoteDebug = DevMenuAction(withId: "remote-debug", action: action)
    remoteDebug.label = { remoteDebug.isAvailable() ? remoteDebug.isEnabled() ? "Stop Remote Debugging" : "Debug Remote JS" : "Remote Debugger Unavailable" }
    remoteDebug.glyphName = { "remote-desktop" }
    remoteDebug.importance = DevMenuItem.ImportanceLow
    return remoteDebug
  }

  public static func fastRefreshAction(_ action: @escaping () -> ()) -> DevMenuAction {
    let fastRefresh = DevMenuAction(withId: "fast-refresh", action: action)
    fastRefresh.label = { fastRefresh.isAvailable() ? fastRefresh.isEnabled() ? "Disable Fast Refresh" : "Enable Fast Refresh" : "Fast Refresh Unavailable" }
    fastRefresh.glyphName = { "run-fast" }
    fastRefresh.importance = DevMenuItem.ImportanceLow
    return fastRefresh
  }

  public static func performanceMonitorAction(_ action: @escaping () -> ()) -> DevMenuAction {
    let perfMonitor = DevMenuAction(withId: "performance-monitor", action: action)
    perfMonitor.label = { perfMonitor.isAvailable() ? perfMonitor.isEnabled() ? "Hide Performance Monitor" : "Show Performance Monitor" : "Performance Monitor Unavailable" }
    perfMonitor.glyphName = { "speedometer" }
    perfMonitor.importance = DevMenuItem.ImportanceHigh
    perfMonitor.registerKeyCommand(input: "p", modifiers: .command)
    return perfMonitor
  }
}
