import Testing
import UIKit

@testable import ExpoRouter

private final class MockPathView: UIView {
  @objc var screenId: String?
  @objc var screenKey: String?
  @objc var nativeId: String?
  @objc var screenIds: [String] = []
  @objc var activityState: Int32 = 2
  @objc var controller: UIViewController?
  var mockReactViewController: UIViewController?
  var mockReactSubviews: [UIView] = []

  override func reactSubviews() -> [UIView]! {
    mockReactSubviews
  }

  @objc override func reactViewController() -> UIViewController? {
    mockReactViewController
  }
}

@Suite("LinkPreviewPathWalker")
@MainActor
struct LinkPreviewPathWalkerTests {
  private let walker = LinkPreviewPathWalker()

  @Test
  func `finds a preloaded screen through nested stacks without changing tabs`() throws {
    let target = screen(id: "details", activityState: 0)
    let innerStack = stack(
      ids: ["home", "details"],
      children: [
        screen(id: "home"), target,
      ]
    )
    let rootScreen = screen(id: "root", children: [innerStack])
    let rootStack = stack(ids: ["root"], children: [rootScreen])
    let responder = attachResponder(to: rootStack)

    let result = walker.walk(
      path: path(("root", "root"), ("details", "details")),
      responder: responder
    )

    #expect(result.preloadedScreenView === target)
    #expect(result.preloadedStackView === innerStack)
    #expect(result.tabChangeCommands.isEmpty)
  }

  @Test
  func `does not match an enclosing JS tab by the inner native tab name`() {
    let tabs = tabHost(selectedIndex: 0, tabs: [tab(name: "index"), tab(name: "settings")])
    let result = walker.walk(
      path: path(("outer-settings-key", "settings")),
      responder: attachResponder(to: tabs.host)
    )
    #expect(result.tabChangeCommands.isEmpty)
    #expect(result.preloadedScreenView == nil)
  }

  @Test
  func `selects an unselected tab`() throws {
    let target = screen(id: "details", activityState: 0)
    let targetStack = stack(ids: ["details"], children: [target])
    let tabs = tabHost(
      selectedIndex: 0,
      tabs: [
        tab(name: "home"),
        tab(name: "settings", children: [targetStack]),
      ]
    )
    let rootScreen = screen(id: "root", children: [tabs.host])
    let rootStack = stack(ids: ["root"], children: [rootScreen])

    let result = walker.walk(
      path: path(("root", "root"), ("settings-key", "settings"), ("details", "details")),
      responder: attachResponder(to: rootStack)
    )

    let command = try #require(result.tabChangeCommands.first)
    #expect(result.tabChangeCommands.count == 1)
    #expect(command.tabBarController === tabs.controller)
    #expect(command.tabIndex == 1)
    #expect(result.preloadedScreenView === target)
  }

  @Test
  func `does not change an already selected tab`() {
    let target = screen(id: "details", activityState: 0)
    let targetStack = stack(ids: ["details"], children: [target])
    let tabs = tabHost(
      selectedIndex: 1,
      tabs: [
        tab(name: "home"),
        tab(name: "settings", children: [targetStack]),
      ]
    )
    let rootScreen = screen(id: "root", children: [tabs.host])
    let rootStack = stack(ids: ["root"], children: [rootScreen])

    let result = walker.walk(
      path: path(("root", "root"), ("settings-key", "settings"), ("details", "details")),
      responder: attachResponder(to: rootStack)
    )

    #expect(result.tabChangeCommands.isEmpty)
    #expect(result.preloadedScreenView === target)
  }

  @Test
  func `orders nested tab changes outer first`() throws {
    let innerTabs = tabHost(
      selectedIndex: 0,
      tabs: [
        tab(name: "feed"),
        tab(name: "profile"),
      ]
    )
    let outerTabs = tabHost(
      selectedIndex: 0,
      tabs: [
        tab(name: "home"),
        tab(name: "account", children: [innerTabs.host]),
      ]
    )
    let rootScreen = screen(id: "root", children: [outerTabs.host])
    let rootStack = stack(ids: ["root"], children: [rootScreen])

    let result = walker.walk(
      path: path(("root", "root"), ("account-key", "account"), ("profile-key", "profile")),
      responder: attachResponder(to: rootStack)
    )

    #expect(result.tabChangeCommands.count == 2)
    #expect(result.tabChangeCommands[0].tabBarController === outerTabs.controller)
    #expect(result.tabChangeCommands[0].tabIndex == 1)
    #expect(result.tabChangeCommands[1].tabBarController === innerTabs.controller)
    #expect(result.tabChangeCommands[1].tabIndex == 1)
  }

  @Test
  func `supports a path ending at a tab`() throws {
    let tabs = tabHost(selectedIndex: 0, tabs: [tab(name: "home"), tab(name: "settings")])
    let rootScreen = screen(id: "root", children: [tabs.host])
    let rootStack = stack(ids: ["root"], children: [rootScreen])

    let result = walker.walk(
      path: path(("root", "root"), ("settings-key", "settings")),
      responder: attachResponder(to: rootStack)
    )

    let command = try #require(result.tabChangeCommands.first)
    #expect(result.preloadedScreenView == nil)
    #expect(command.tabBarController === tabs.controller)
    #expect(command.tabIndex == 1)
  }

  @Test
  func `selects a tab without an enclosing stack`() throws {
    let tabs = tabHost(selectedIndex: 0, tabs: [tab(name: "home"), tab(name: "second")])
    let responder = attachResponder(to: tabs.controller.viewControllers![0].view)

    let result = walker.walk(
      path: path(("root", "__root"), ("second-key", "second")),
      responder: responder
    )

    let command = try #require(result.tabChangeCommands.first)
    #expect(result.tabChangeCommands.count == 1)
    #expect(command.tabBarController === tabs.controller)
    #expect(command.tabIndex == 1)
    #expect(result.preloadedScreenView == nil)
  }

  @Test
  func `skips JS-only view levels`() {
    let target = screen(id: "details", activityState: 0)
    let targetStack = stack(ids: ["details"], children: [target])
    let wrapper = UIView()
    wrapper.addSubview(targetStack)
    let rootScreen = screen(id: "root", children: [wrapper])
    let rootStack = stack(ids: ["root"], children: [rootScreen])

    let result = walker.walk(
      path: path(("root", "root"), ("js-layout", "js-layout"), ("details", "details")),
      responder: attachResponder(to: rootStack)
    )

    #expect(result.preloadedScreenView === target)
  }

  @Test
  func `does not select an active terminal screen`() {
    let target = screen(id: "details", activityState: 2)
    let rootStack = stack(ids: ["details"], children: [target])

    let result = walker.walk(
      path: path(("details", "details")),
      responder: attachResponder(to: rootStack)
    )

    #expect(result.preloadedScreenView == nil)
    #expect(result.preloadedStackView == nil)
  }

  @Test
  func `reports inactive l1 instead of its already active l2 destination`() {
    let l2 = screen(id: "l2", activityState: 2)
    let childStack = stack(ids: ["l2"], children: [l2])
    let l1 = screen(id: "l1", activityState: 0, children: [childStack])
    let rootStack = stack(ids: ["index", "l1"], children: [screen(id: "index"), l1])

    let result = walker.walk(
      path: path(("l1", "l1"), ("l2", "l2")),
      responder: attachResponder(to: rootStack)
    )

    #expect(result.preloadedScreenView === l1)
    #expect(result.preloadedScreenView !== l2)
    #expect(result.preloadedStackView === rootStack)
  }

  @Test
  func `uses a preloaded ancestor and preserves nested tab changes`() throws {
    let activeChild = screen(id: "child", activityState: 2)
    let childStack = stack(ids: ["child"], children: [activeChild])
    let tabs = tabHost(
      selectedIndex: 0,
      tabs: [
        tab(name: "home"),
        tab(name: "settings", children: [childStack]),
      ]
    )
    let preloadedParent = screen(id: "parent", activityState: 0, children: [tabs.host])
    let rootStack = stack(ids: ["parent"], children: [preloadedParent])

    let result = walker.walk(
      path: path(("parent", "parent"), ("settings-key", "settings"), ("child", "child")),
      responder: attachResponder(to: rootStack)
    )

    #expect(result.preloadedScreenView === preloadedParent)
    #expect(result.preloadedStackView === rootStack)
    let command = try #require(result.tabChangeCommands.first)
    #expect(result.tabChangeCommands.count == 1)
    #expect(command.tabBarController === tabs.controller)
    #expect(command.tabIndex == 1)
  }

  @Test
  func `ignores unknown keys and names`() {
    let tabs = tabHost(selectedIndex: 0, tabs: [tab(name: "home")])
    let rootScreen = screen(id: "root", children: [tabs.host])
    let rootStack = stack(ids: ["root"], children: [rootScreen])

    let result = walker.walk(
      path: path(("root", "root"), ("missing-key", "missing-name")),
      responder: attachResponder(to: rootStack)
    )

    #expect(result.preloadedScreenView == nil)
    #expect(result.tabChangeCommands.isEmpty)
  }

  private func path(_ routes: (String, String)...) -> [PreviewActivationRoute] {
    routes.map { PreviewActivationRoute(key: $0.0, name: $0.1) }
  }

  private func screen(
    id: String,
    activityState: Int32 = 2,
    children: [UIView] = []
  ) -> MockPathView {
    let view = MockPathView()
    view.screenId = id
    view.activityState = activityState
    view.mockReactSubviews = children
    children.forEach(view.addSubview)
    return view
  }

  private func stack(ids: [String], children: [UIView]) -> MockPathView {
    let view = MockPathView()
    view.screenIds = ids
    view.mockReactSubviews = children
    children.forEach(view.addSubview)
    return view
  }

  private func tab(name: String, children: [UIView] = []) -> MockPathView {
    let view = MockPathView()
    view.screenKey = name
    view.nativeId = "expo-router-tab:\(name)-key"
    view.mockReactSubviews = children
    children.forEach(view.addSubview)
    return view
  }

  private func tabHost(
    selectedIndex: Int,
    tabs: [MockPathView]
  ) -> (host: MockPathView, controller: UITabBarController) {
    let controller = UITabBarController()
    controller.viewControllers = tabs.map { tabView in
      let viewController = UIViewController()
      viewController.view = tabView
      tabView.mockReactViewController = viewController
      return viewController
    }
    controller.selectedIndex = selectedIndex
    let host = MockPathView()
    host.controller = controller
    return (host, controller)
  }

  private func attachResponder(to root: UIView) -> UIView {
    let responder = UIView()
    root.addSubview(responder)
    return responder
  }
}
