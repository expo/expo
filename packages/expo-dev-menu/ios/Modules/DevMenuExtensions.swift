// Copyright 2015-present 650 Industries. All rights reserved.

import EXDevMenuInterface

@objc(DevMenuExtensions)
open class DevMenuExtensions: NSObject, DevMenuExtensionProtocol {
  @objc
  open var bridge: RCTBridge?

  // MARK: DevMenuExtensionProtocol

  @objc
  open func devMenuItems(_ settings: DevMenuExtensionSettingsProtocol) -> DevMenuItemsContainerProtocol? {
    if !settings.wasRunOnDevelopmentBridge() {
      return nil
    }

    guard let bridge = bridge else {
      return nil
    }

    let devDelegate = DevMenuDevOptionsDelegate(forBridge: bridge)
    guard let devSettings = devDelegate.devSettings else {
      return nil
    }

    let container = DevMenuItemsContainer()

    let reload = DevMenuExtensions.reloadAction(devDelegate.reload)
    reload.isAvailable = { !DevMenuExtensions.checkIfLogBoxIsOpened() }

    let inspector = DevMenuExtensions.elementInspectorAction(devDelegate.toggleElementInsector)
    inspector.isEnabled = { devSettings.isElementInspectorShown }

    #if DEBUG
    let jsInspector = DevMenuExtensions.jsInspectorAction(devDelegate.openJSInspector)
    jsInspector.isAvailable = { bridge.batched.isInspectable }
    jsInspector.isEnabled = { true }

    let remoteDebug = DevMenuExtensions.remoteDebugAction(devDelegate.toggleRemoteDebugging)
    remoteDebug.isAvailable = { devSettings.isRemoteDebuggingAvailable }
    remoteDebug.isEnabled = { devSettings.isDebuggingRemotely }

    let fastRefresh = DevMenuExtensions.fastRefreshAction(devDelegate.toggleFastRefresh)
    fastRefresh.isAvailable = { devSettings.isHotLoadingAvailable }
    fastRefresh.isEnabled = { devSettings.isHotLoadingEnabled }

    let perfMonitor = DevMenuExtensions.performanceMonitorAction(devDelegate.togglePerformanceMonitor)
    perfMonitor.isAvailable = { devDelegate.perfMonitor != nil }
    perfMonitor.isEnabled = { devSettings.isPerfMonitorShown }

    container.addItem(reload)
    container.addItem(perfMonitor)
    container.addItem(inspector)
    container.addItem(jsInspector)
    container.addItem(remoteDebug)
    container.addItem(fastRefresh)

    #endif

    return container
  }

  @objc
  open func devMenuScreens(_ settings: DevMenuExtensionSettingsProtocol) -> [DevMenuScreen]? {
    return nil
  }

  @objc
  open func devMenuDataSources(_ settings: DevMenuExtensionSettingsProtocol) -> [DevMenuDataSourceProtocol]? {
    return nil
  }

  // MARK: static helpers

  private static func reloadAction(_ action: @escaping () -> Void) -> DevMenuAction {
    let reload = DevMenuAction(withId: "reload", action: action)
    reload.label = { "Reload" }
    reload.glyphName = { "reload" }
    reload.importance = DevMenuScreenItem.ImportanceHighest
    reload.registerKeyCommand(input: "r", modifiers: []) // "r" without modifiers
    return reload
  }

  private static func elementInspectorAction(_ action: @escaping () -> Void) -> DevMenuAction {
    let inspector = DevMenuAction(withId: "inspector", action: action)
    inspector.label = { inspector.isEnabled() ? "Hide Element Inspector" : "Show Element Inspector" }
    inspector.glyphName = { "border-style" }
    inspector.importance = DevMenuScreenItem.ImportanceHigh
    inspector.registerKeyCommand(input: "i", modifiers: .command)
    return inspector
  }

  private static func jsInspectorAction(_ action: @escaping () -> Void) -> DevMenuAction {
    let jsInspectror = DevMenuAction(withId: "js-inspector", action: action)
    jsInspectror.label = { "Open JS debugger" }
    jsInspectror.glyphName = { "language-javascript" }
    jsInspectror.importance = DevMenuScreenItem.ImportanceLow
    return jsInspectror
  }

  private static func remoteDebugAction(_ action: @escaping () -> Void) -> DevMenuAction {
    let remoteDebug = DevMenuAction(withId: "remote-debug", action: action)
    remoteDebug.label = { remoteDebug.isAvailable() ? remoteDebug.isEnabled() ? "Stop Remote Debugging" : "Debug Remote JS" : "Remote Debugger Unavailable" }
    remoteDebug.glyphName = { "remote-desktop" }
    remoteDebug.importance = DevMenuScreenItem.ImportanceLow
    return remoteDebug
  }

  private static func fastRefreshAction(_ action: @escaping () -> Void) -> DevMenuAction {
    let fastRefresh = DevMenuAction(withId: "fast-refresh", action: action)
    fastRefresh.label = { fastRefresh.isAvailable() ? fastRefresh.isEnabled() ? "Disable Fast Refresh" : "Enable Fast Refresh" : "Fast Refresh Unavailable" }
    fastRefresh.glyphName = { "run-fast" }
    fastRefresh.importance = DevMenuScreenItem.ImportanceLow
    return fastRefresh
  }

  private static func performanceMonitorAction(_ action: @escaping () -> Void) -> DevMenuAction {
    let perfMonitor = DevMenuAction(withId: "performance-monitor", action: action)
    perfMonitor.label = { perfMonitor.isAvailable() ? perfMonitor.isEnabled() ? "Hide Performance Monitor" : "Show Performance Monitor" : "Performance Monitor Unavailable" }
    perfMonitor.glyphName = { "speedometer" }
    perfMonitor.importance = DevMenuScreenItem.ImportanceHigh
    perfMonitor.registerKeyCommand(input: "p", modifiers: .command)
    return perfMonitor
  }

  private static func checkIfLogBoxIsOpened() -> Bool {
    return UIApplication.shared.windows.contains {
      let className = String(describing: type(of: $0))
      if className == "RCTLogBoxView" || className == "RCTRedBoxView" {
        return true
      }

      return false
    }
  }
}
