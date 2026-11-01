// Copyright 2026-present 650 Industries. All rights reserved.

import React
import Testing
import UIKit

@testable import ExpoModulesCore

private final class TestFabricView: ExpoView {}

/// Stands in for `RCTSurfacePresenter`, which calls its observers around each mount transaction.
private final class TestSurfacePresenter: NSObject, RCTSurfacePresenterStub {
  private var observers = [RCTSurfacePresenterObserver]()

  func mount(_ createViews: () -> Void) {
    observers.forEach { $0.willMountComponents?(withRootTag: 1) }
    createViews()
    observers.forEach { $0.didMountComponents?(withRootTag: 1) }
  }

  func add(_ observer: RCTSurfacePresenterObserver) {
    observers.append(observer)
  }

  func remove(_ observer: RCTSurfacePresenterObserver) {
    observers.removeAll { $0 === observer }
  }

  func createFabricSurface(forModuleName moduleName: String, initialProperties: [AnyHashable: Any]) -> RCTSurfaceProtocol {
    fatalError("Not used in tests")
  }

  func findComponentView(withTag_DO_NOT_USE_DEPRECATED tag: Int) -> UIView? {
    return nil
  }

  func synchronouslyUpdateView(onUIThread reactTag: NSNumber, props: [AnyHashable: Any]) {}
}

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
  func `creates views for the app context whose host is mounting`() throws {
    let moduleName = uniqueModuleName()
    let first = makeAppContext(moduleName: moduleName)
    let second = makeAppContext(moduleName: moduleName)
    let firstObserver = SurfacePresenterObserver(appContext: first)
    let secondObserver = SurfacePresenterObserver(appContext: second)
    let viewClass = try #require(ExpoFabricView.viewClass(moduleName: moduleName, viewName: DEFAULT_MODULE_VIEW) as? ExpoFabricView.Type)

    // `RCTSurfacePresenter` calls these on its observers around each mount transaction.
    firstObserver.willMountComponents(withRootTag: 1)
    let firstView = viewClass.createComponentView() as? TestFabricView
    firstObserver.didMountComponents(withRootTag: 1)

    secondObserver.willMountComponents(withRootTag: 1)
    let secondView = viewClass.createComponentView() as? TestFabricView
    secondObserver.didMountComponents(withRootTag: 1)

    #expect(firstView?.appContext === first)
    #expect(secondView?.appContext === second)
  }

  @Test
  func `restores the outer app context after a nested mount of another host`() throws {
    let moduleName = uniqueModuleName()
    let outer = makeAppContext(moduleName: moduleName)
    let inner = makeAppContext(moduleName: moduleName)
    let outerObserver = SurfacePresenterObserver(appContext: outer)
    let innerObserver = SurfacePresenterObserver(appContext: inner)
    let viewClass = try #require(ExpoFabricView.viewClass(moduleName: moduleName, viewName: DEFAULT_MODULE_VIEW) as? ExpoFabricView.Type)

    outerObserver.willMountComponents(withRootTag: 1)
    innerObserver.willMountComponents(withRootTag: 1)
    let innerView = viewClass.createComponentView() as? TestFabricView
    innerObserver.didMountComponents(withRootTag: 1)
    let outerView = viewClass.createComponentView() as? TestFabricView
    outerObserver.didMountComponents(withRootTag: 1)

    #expect(innerView?.appContext === inner)
    #expect(outerView?.appContext === outer)
    #expect(AppContext.mountingAppContext == nil)
  }

  @Test
  func `creates views from the class initializer used by React Native`() throws {
    let moduleName = uniqueModuleName()
    let appContext = makeAppContext(moduleName: moduleName)
    let observer = SurfacePresenterObserver(appContext: appContext)
    let viewClass: AnyClass = ExpoFabricView.viewClass(moduleName: moduleName, viewName: DEFAULT_MODULE_VIEW)

    observer.willMountComponents(withRootTag: 1)
    // `RCTComponentViewFactory` creates component views with `[viewClass new]`.
    let view = (viewClass as AnyObject).perform(NSSelectorFromString("new"))?.takeRetainedValue() as? TestFabricView
    observer.didMountComponents(withRootTag: 1)

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

  @Test
  func `creates views for the app context that observes the mounting surface presenter`() throws {
    let moduleName = uniqueModuleName()
    let appContext = makeAppContext(moduleName: moduleName)
    let observer = SurfacePresenterObserver(appContext: appContext)
    let surfacePresenter = TestSurfacePresenter()
    let viewClass = try #require(ExpoFabricView.viewClass(moduleName: moduleName, viewName: DEFAULT_MODULE_VIEW) as? ExpoFabricView.Type)

    #expect(observer.observe(surfacePresenter))

    var view: TestFabricView?
    surfacePresenter.mount {
      view = viewClass.createComponentView() as? TestFabricView
    }

    #expect(view?.appContext === appContext)
    #expect(AppContext.mountingAppContext == nil)
  }

  @Test
  func `creates views for the newest app context that observes the surface presenter`() throws {
    let moduleName = uniqueModuleName()
    let older = makeAppContext(moduleName: moduleName)
    let newer = makeAppContext(moduleName: moduleName)
    let olderObserver = SurfacePresenterObserver(appContext: older)
    let newerObserver = SurfacePresenterObserver(appContext: newer)
    let surfacePresenter = TestSurfacePresenter()
    let viewClass = try #require(ExpoFabricView.viewClass(moduleName: moduleName, viewName: DEFAULT_MODULE_VIEW) as? ExpoFabricView.Type)

    #expect(olderObserver.observe(surfacePresenter))
    #expect(newerObserver.observe(surfacePresenter))

    var view: TestFabricView?
    surfacePresenter.mount {
      view = viewClass.createComponentView() as? TestFabricView
    }

    #expect(view?.appContext === newer)
    #expect(AppContext.mountingAppContext == nil)
  }

  @Test
  func `doesn't observe the surface presenter that a newer app context observes`() throws {
    let moduleName = uniqueModuleName()
    let older = makeAppContext(moduleName: moduleName)
    let newer = makeAppContext(moduleName: moduleName)
    let olderObserver = SurfacePresenterObserver(appContext: older)
    let newerObserver = SurfacePresenterObserver(appContext: newer)
    let surfacePresenter = TestSurfacePresenter()
    let viewClass = try #require(ExpoFabricView.viewClass(moduleName: moduleName, viewName: DEFAULT_MODULE_VIEW) as? ExpoFabricView.Type)

    // After quick consecutive reloads, the older app context can observe the newer runtime's presenter last.
    #expect(newerObserver.observe(surfacePresenter))
    #expect(!olderObserver.observe(surfacePresenter))

    var view: TestFabricView?
    surfacePresenter.mount {
      view = viewClass.createComponentView() as? TestFabricView
    }

    #expect(view?.appContext === newer)
  }

  @Test
  func `creates an empty view when the mounting app context doesn't have the module`() throws {
    let moduleName = uniqueModuleName()
    let appContext = AppContext()
    let observer = SurfacePresenterObserver(appContext: appContext)
    let viewClass = try #require(ExpoFabricView.viewClass(moduleName: moduleName, viewName: DEFAULT_MODULE_VIEW) as? ExpoFabricView.Type)

    observer.willMountComponents(withRootTag: 1)
    let view = viewClass.createComponentView() as? ExpoFabricView
    observer.didMountComponents(withRootTag: 1)

    let emptyView = try #require(view)
    // `type(of:)` reports the Swift superclass for classes created at runtime, so compare the Objective-C class.
    #expect(object_getClass(emptyView) === viewClass)
    #expect(emptyView.appContext === appContext)
  }

  @Test
  func `keeps the mounting app context when an older app context's observer is notified`() throws {
    let moduleName = uniqueModuleName()
    let outer = makeAppContext(moduleName: moduleName)
    let older = makeAppContext(moduleName: moduleName)
    let newer = makeAppContext(moduleName: moduleName)
    let outerObserver = SurfacePresenterObserver(appContext: outer)
    let olderObserver = SurfacePresenterObserver(appContext: older)
    let newerObserver = SurfacePresenterObserver(appContext: newer)
    let surfacePresenter = TestSurfacePresenter()

    #expect(olderObserver.observe(surfacePresenter))
    #expect(newerObserver.observe(surfacePresenter))

    // The observer of the older app context ignores the mount, so its `didMount` must not restore anything.
    outerObserver.willMountComponents(withRootTag: 1)
    olderObserver.willMountComponents(withRootTag: 2)
    olderObserver.didMountComponents(withRootTag: 2)

    #expect(AppContext.mountingAppContext === outer)

    outerObserver.didMountComponents(withRootTag: 1)
    #expect(AppContext.mountingAppContext == nil)
  }
}
