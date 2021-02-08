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
  open func devMenuItems() -> DevMenuItemsContainerProtocol? {
    guard let devSettings = bridge?.module(forName: "DevSettings") as? RCTDevSettings else {
      return nil
    }
    
    let container = DevMenuItemsContainer()
    
    let reload = DevMenuExtensions.reloadAction {
      // Without this the `expo-splash-screen` will reject
      // No native splash screen registered for given view controller. Call 'SplashScreen.show' for given view controller first.
      DevMenuManager.shared.hideMenu();
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

    container.addItem(remoteDebug)
    container.addItem(fastRefresh)
    container.addItem(perfMonitor)
    #endif
  
    container.addItem(reload)
    container.addItem(inspector)
  
    let group = DevMenuGroup()
    group.importance = DevMenuScreenItem.ImportanceLowest
    
    let link = DevMenuLink(withTarget: "testScreen")
    link.label = { "Test Screen" }
    link.glyphName = { "test-tube" }
    
    group.addItem(link)
    container.addItem(group)
    
    return container
  }
  
  @objc
  open func devMenuScreens() -> [DevMenuScreen]? {
    let testScreen = DevMenuScreen("testScreen")

    let selectionList = DevMenuSelectionList()
    let relase10 = DevMenuSelectionList.Item()
    relase10.isChecked = { true }
    relase10.title = { "release-1.0" }
    relase10.warning = { "You are currently running an older development client version than the latest \"release-1.0\" update. To get the latest, upgrade this development client app." }
    let relase10ProductionTag = DevMenuSelectionList.Item.Tag()
    relase10ProductionTag.glyphName = { "ios-git-network" }
    relase10ProductionTag.text = { "production" }
    
    let relase10ProgressTag = DevMenuSelectionList.Item.Tag()
    relase10ProgressTag.glyphName = { "ios-cloud" }
    relase10ProgressTag.text = { "90%" }
    
    relase10.tags = { [relase10ProductionTag, relase10ProgressTag] }
    
    let pr134 = DevMenuSelectionList.Item()
    pr134.title = { "pr-134" }
    
    let relase11 = DevMenuSelectionList.Item()
    relase11.isChecked = { false }
    relase11.title = { "release-1.1" }
    let relase11ProductionTag = DevMenuSelectionList.Item.Tag()
    relase11ProductionTag.glyphName = { "ios-git-network" }
    relase11ProductionTag.text = { "production" }
    
    let relase11ProgressTag = DevMenuSelectionList.Item.Tag()
    relase11ProgressTag.glyphName = { "ios-cloud" }
    relase11ProgressTag.text = { "10%" }
    
    relase11.tags = { [relase11ProductionTag, relase11ProgressTag] }
    
    let pr21 = DevMenuSelectionList.Item()
    pr21.title = { "pr-21" }
    
    selectionList.addItem(relase10)
    selectionList.addItem(pr134)
    selectionList.addItem(relase11)
    selectionList.addItem(pr21)
    
    testScreen.addItem(selectionList)
    
    return [testScreen]
  }

  // MARK: static helpers

  public static func reloadAction(action: @escaping () -> ()) -> DevMenuAction {
    let reload = DevMenuAction(withId: "reload", action: action)
    reload.label = { "Reload" }
    reload.glyphName = { "reload" }
    reload.importance = DevMenuScreenItem.ImportanceHighest
    reload.registerKeyCommand(input: "r", modifiers: .command)
    return reload
  }

  public static func elementInspectorAction(_ action: @escaping () -> ()) -> DevMenuAction {
    let inspector = DevMenuAction(withId: "inspector", action: action)
    inspector.label = { inspector.isEnabled() ? "Hide Element Inspector" : "Show Element Inspector" }
    inspector.glyphName = { "border-style" }
    inspector.importance = DevMenuScreenItem.ImportanceHigh
    inspector.registerKeyCommand(input: "i", modifiers: .command)
    return inspector
  }

  public static func remoteDebugAction(_ action: @escaping () -> ()) -> DevMenuAction {
    let remoteDebug = DevMenuAction(withId: "remote-debug", action: action)
    remoteDebug.label = { remoteDebug.isAvailable() ? remoteDebug.isEnabled() ? "Stop Remote Debugging" : "Debug Remote JS" : "Remote Debugger Unavailable" }
    remoteDebug.glyphName = { "remote-desktop" }
    remoteDebug.importance = DevMenuScreenItem.ImportanceLow
    return remoteDebug
  }

  public static func fastRefreshAction(_ action: @escaping () -> ()) -> DevMenuAction {
    let fastRefresh = DevMenuAction(withId: "fast-refresh", action: action)
    fastRefresh.label = { fastRefresh.isAvailable() ? fastRefresh.isEnabled() ? "Disable Fast Refresh" : "Enable Fast Refresh" : "Fast Refresh Unavailable" }
    fastRefresh.glyphName = { "run-fast" }
    fastRefresh.importance = DevMenuScreenItem.ImportanceLow
    return fastRefresh
  }

  public static func performanceMonitorAction(_ action: @escaping () -> ()) -> DevMenuAction {
    let perfMonitor = DevMenuAction(withId: "performance-monitor", action: action)
    perfMonitor.label = { perfMonitor.isAvailable() ? perfMonitor.isEnabled() ? "Hide Performance Monitor" : "Show Performance Monitor" : "Performance Monitor Unavailable" }
    perfMonitor.glyphName = { "speedometer" }
    perfMonitor.importance = DevMenuScreenItem.ImportanceHigh
    perfMonitor.registerKeyCommand(input: "p", modifiers: .command)
    return perfMonitor
  }
}
