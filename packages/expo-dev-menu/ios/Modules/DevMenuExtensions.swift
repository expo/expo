// Copyright 2015-present 650 Industries. All rights reserved.

import EXDevMenuInterface

@objc(DevMenuExtensions)
open class DevMenuExtensions: NSObject, DevMenuExtensionProtocol {

  @objc
  open var bridge: RCTBridge?

  // MARK: DevMenuExtensionProtocol

  @objc
  open func devMenuItems(_ settings: DevMenuExtensionSettingsProtocol) -> DevMenuItemsContainerProtocol? {
    if (!settings.wasRunOnDevelopmentBridge()) {
      return nil
    }
    
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
    reload.isAvailable = { !DevMenuExtensions.checkIfLogBoxIsOpened() }

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
  
    container.addItem(reload)
    container.addItem(inspector)
    #endif
    
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
  open func devMenuScreens(_ settings: DevMenuExtensionSettingsProtocol) -> [DevMenuScreen]? {
    if (!settings.wasRunOnDevelopmentBridge()) {
      return nil
    }
    
    let testScreen = DevMenuScreen("testScreen")

    let selectionList = DevMenuSelectionList(dataSourceId: "updatesList")
    selectionList.addOnClick { data in
      print(data!["id"]!)
    }
    
    testScreen.addItem(selectionList)
    
    return [testScreen]
  }
  
  @objc
  open func devMenuDataSources(_ settings: DevMenuExtensionSettingsProtocol) -> [DevMenuDataSourceProtocol]? {
    if (!settings.wasRunOnDevelopmentBridge()) {
      return nil
    }
    
    let updatesList = DevMenuListDataSource(id: "updatesList") { resolver in
      let client = DevMenuManager.shared.expoApiClient
      client.queryUpdateBranches(
        appId: "3d4813b8-ad48-4e1e-9e8f-0f7d108bf041",
        completionHandler: { branches, response, error in
          guard let branches = branches else {
            resolver([])
            return
          }
          
          let items = branches
            .flatMap { $0.updates }
            .filter { $0.platform == "ios" }
            .map { update -> DevMenuSelectionList.Item  in
              let item = DevMenuSelectionList.Item()
              item.title = { update.message }
              item.onClickData = { ["id": update.id] }
              return item
            }
        
          resolver(items)
        }
      )
    }
    
    return [updatesList]
  }

  // MARK: static helpers

  private static func reloadAction(action: @escaping () -> ()) -> DevMenuAction {
    let reload = DevMenuAction(withId: "reload", action: action)
    reload.label = { "Reload" }
    reload.glyphName = { "reload" }
    reload.importance = DevMenuScreenItem.ImportanceHighest
    reload.registerKeyCommand(input: "r", modifiers: .command)
    return reload
  }

  private static func elementInspectorAction(_ action: @escaping () -> ()) -> DevMenuAction {
    let inspector = DevMenuAction(withId: "inspector", action: action)
    inspector.label = { inspector.isEnabled() ? "Hide Element Inspector" : "Show Element Inspector" }
    inspector.glyphName = { "border-style" }
    inspector.importance = DevMenuScreenItem.ImportanceHigh
    inspector.registerKeyCommand(input: "i", modifiers: .command)
    return inspector
  }

  private static func remoteDebugAction(_ action: @escaping () -> ()) -> DevMenuAction {
    let remoteDebug = DevMenuAction(withId: "remote-debug", action: action)
    remoteDebug.label = { remoteDebug.isAvailable() ? remoteDebug.isEnabled() ? "Stop Remote Debugging" : "Debug Remote JS" : "Remote Debugger Unavailable" }
    remoteDebug.glyphName = { "remote-desktop" }
    remoteDebug.importance = DevMenuScreenItem.ImportanceLow
    return remoteDebug
  }

  private static func fastRefreshAction(_ action: @escaping () -> ()) -> DevMenuAction {
    let fastRefresh = DevMenuAction(withId: "fast-refresh", action: action)
    fastRefresh.label = { fastRefresh.isAvailable() ? fastRefresh.isEnabled() ? "Disable Fast Refresh" : "Enable Fast Refresh" : "Fast Refresh Unavailable" }
    fastRefresh.glyphName = { "run-fast" }
    fastRefresh.importance = DevMenuScreenItem.ImportanceLow
    return fastRefresh
  }

  private static func performanceMonitorAction(_ action: @escaping () -> ()) -> DevMenuAction {
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
