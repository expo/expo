// Copyright 2026-present 650 Industries. All rights reserved.

import Testing
import UIKit

@testable import ExpoModulesCore

private final class TestFabricView: ExpoView {}

// View classes and the mounting app context are main-thread state.
@Suite("ExpoFabricView")
@MainActor
struct ExpoFabricViewTests {
  /// Component view classes are process-wide, so each test uses its own module name.
  private func uniqueModuleName() -> String {
    return "TestModule\(UUID().uuidString.replacingOccurrences(of: "-", with: ""))"
  }

  private func makeAppContext(moduleName: String) -> AppContext {
    let appContext = AppContext()
    let holder = mockModuleHolder(appContext) {
      Name(moduleName)
      View(TestFabricView.self) {}
    }
    appContext.moduleRegistry.register(holder: holder)
    return appContext
  }

  @Test
  func `names the default view after the module`() {
    #expect(ExpoFabricView.componentName(moduleName: "ExpoImage", viewName: DEFAULT_MODULE_VIEW) == "ViewManagerAdapter_ExpoImage")
  }

  @Test
  func `names other views after the module and the view`() {
    #expect(ExpoFabricView.componentName(moduleName: "ExpoUI", viewName: "Button") == "ViewManagerAdapter_ExpoUI_Button")
  }

  @Test
  func `reuses the view class for the same component`() {
    let moduleName = uniqueModuleName()
    let first: AnyClass = ExpoFabricView.viewClass(moduleName: moduleName, viewName: DEFAULT_MODULE_VIEW)
    let second: AnyClass = ExpoFabricView.viewClass(moduleName: moduleName, viewName: DEFAULT_MODULE_VIEW)

    #expect(first === second)
    #expect(NSStringFromClass(first) == "ViewManagerAdapter_\(moduleName)")
    #expect(NSClassFromString("ViewManagerAdapter_\(moduleName)") === first)
  }

  @Test
  func `creates views for the app context that is mounting`() throws {
    let moduleName = uniqueModuleName()
    let first = makeAppContext(moduleName: moduleName)
    let second = makeAppContext(moduleName: moduleName)
    let viewClass = try #require(ExpoFabricView.viewClass(moduleName: moduleName, viewName: DEFAULT_MODULE_VIEW) as? ExpoFabricView.Type)

    first.hostWillMountComponents()
    let firstView = viewClass.createComponentView() as? TestFabricView
    first.hostDidMountComponents()

    second.hostWillMountComponents()
    let secondView = viewClass.createComponentView() as? TestFabricView
    second.hostDidMountComponents()

    #expect(firstView?.appContext === first)
    #expect(secondView?.appContext === second)
  }

  @Test
  func `creates views from the class initializer used by React Native`() throws {
    let moduleName = uniqueModuleName()
    let appContext = makeAppContext(moduleName: moduleName)
    let viewClass: AnyClass = ExpoFabricView.viewClass(moduleName: moduleName, viewName: DEFAULT_MODULE_VIEW)

    appContext.hostWillMountComponents()
    // `RCTComponentViewFactory` creates component views with `[viewClass new]`.
    let view = (viewClass as AnyObject).perform(NSSelectorFromString("new"))?.takeRetainedValue() as? TestFabricView
    appContext.hostDidMountComponents()

    #expect(view?.appContext === appContext)
  }

  @Test
  func `falls back to the app context that registered views last`() throws {
    let moduleName = uniqueModuleName()
    let appContext = makeAppContext(moduleName: moduleName)
    let viewClass = try #require(ExpoFabricView.viewClass(moduleName: moduleName, viewName: DEFAULT_MODULE_VIEW) as? ExpoFabricView.Type)

    AppContext.viewsRegisteringAppContext = appContext
    let view = viewClass.createComponentView() as? TestFabricView

    #expect(view?.appContext === appContext)
  }
}
