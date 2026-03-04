import Testing
import UIKit

@testable import ExpoRouter

// MARK: - Mock views

/// Mock tab screen: has @objc tabKey property, mimicking RNScreens tab screen views.
private class MockTabScreenView: UIView {
  @objc var tabKey: String?
}

/// Mock tab host: has @objc controller property, mimicking RNScreens tab host views.
private class MockTabHostView: UIView {
  @objc var controller: UIViewController?
}

/// Mock tab host with a non-UIViewController controller property.
private class MockTabHostWithBadController: UIView {
  @objc var controller: NSObject? = NSObject()
}

/// Mock view with a reactViewController() method that returns a UIViewController.
private class MockTabScreenWithReactVC: UIView {
  @objc var tabKey: String?
  private var _reactViewController: UIViewController?

  func configure(reactViewController: UIViewController) {
    _reactViewController = reactViewController
  }

  @objc override func reactViewController() -> UIViewController? {
    return _reactViewController
  }
}

// MARK: - Unit tests

@Suite("RNScreensTabCompat unit tests")
struct RNScreensTabCompatUnitTests {

  @Suite("isTabScreen")
  struct IsTabScreen {
    @Test
    func `detects mock tab screen`() {
      let tabScreen = MockTabScreenView()
      #expect(RNScreensTabCompat.isTabScreen(tabScreen))
    }

    @Test
    func `rejects plain UIView`() {
      let plainView = UIView()
      #expect(!RNScreensTabCompat.isTabScreen(plainView))
    }

    @Test
    func `rejects mock tab host`() {
      let tabHost = MockTabHostView()
      #expect(!RNScreensTabCompat.isTabScreen(tabHost))
    }
  }

  @Suite("tabKey")
  struct TabKey {
    @Test
    func `reads value`() {
      let tabScreen = MockTabScreenView()
      tabScreen.tabKey = "home"
      #expect(RNScreensTabCompat.tabKey(from: tabScreen) == "home")
    }

    @Test
    func `returns nil for nil tab key`() {
      let tabScreen = MockTabScreenView()
      tabScreen.tabKey = nil
      #expect(RNScreensTabCompat.tabKey(from: tabScreen) == nil)
    }

    @Test
    func `returns nil for plain UIView`() {
      let plainView = UIView()
      #expect(RNScreensTabCompat.tabKey(from: plainView) == nil)
    }
  }

  @Suite("tabBarController(fromTabHost:)")
  struct TabBarControllerFromTabHost {
    @Test
    func `returns tab bar controller`() {
      let tabHost = MockTabHostView()
      let tabBarController = UITabBarController()
      tabHost.controller = tabBarController
      #expect(RNScreensTabCompat.tabBarController(fromTabHost: tabHost) === tabBarController)
    }

    @Test
    func `returns nil for non-tab bar controller`() {
      let tabHost = MockTabHostView()
      tabHost.controller = UIViewController()
      #expect(RNScreensTabCompat.tabBarController(fromTabHost: tabHost) == nil)
    }

    @Test
    func `returns nil for nil controller`() {
      let tabHost = MockTabHostView()
      tabHost.controller = nil
      #expect(RNScreensTabCompat.tabBarController(fromTabHost: tabHost) == nil)
    }

    @Test
    func `returns nil for non-UIViewController type`() {
      let tabHost = MockTabHostWithBadController()
      #expect(RNScreensTabCompat.tabBarController(fromTabHost: tabHost) == nil)
    }

    @Test
    func `returns nil for plain UIView`() {
      let plainView = UIView()
      #expect(RNScreensTabCompat.tabBarController(fromTabHost: plainView) == nil)
    }
  }

  @Suite("tabBarController(fromTabScreen:)")
  struct TabBarControllerFromTabScreen {
    @Test
    func `returns tab bar controller via reactViewController`() {
      let tabBarController = UITabBarController()
      let childVC = UIViewController()
      tabBarController.viewControllers = [childVC]

      let mockView = MockTabScreenWithReactVC()
      mockView.tabKey = "tab1"
      mockView.configure(reactViewController: childVC)
      childVC.view.addSubview(mockView)

      let result = RNScreensTabCompat.tabBarController(fromTabScreen: mockView)
      #expect(result === tabBarController)
    }

    @Test
    func `returns nil when reactViewController returns nil`() {
      let mockView = MockTabScreenWithReactVC()
      mockView.tabKey = "tab1"
      // Don't configure — reactViewController() returns nil
      #expect(RNScreensTabCompat.tabBarController(fromTabScreen: mockView) == nil)
    }

    @Test
    func `returns nil when no reactViewController method`() {
      // MockTabScreenView has tabKey but no reactViewController() method
      let mockView = MockTabScreenView()
      mockView.tabKey = "tab1"
      #expect(RNScreensTabCompat.tabBarController(fromTabScreen: mockView) == nil)
    }

    @Test
    func `returns nil for plain UIView`() {
      let plainView = UIView()
      #expect(RNScreensTabCompat.tabBarController(fromTabScreen: plainView) == nil)
    }

    @Test
    func `returns nil when not in tab bar controller`() {
      let navController = UINavigationController()
      let childVC = UIViewController()
      navController.viewControllers = [childVC]

      let mockView = MockTabScreenWithReactVC()
      mockView.tabKey = "tab1"
      mockView.configure(reactViewController: childVC)
      childVC.view.addSubview(mockView)

      #expect(RNScreensTabCompat.tabBarController(fromTabScreen: mockView) == nil)
    }
  }
}

// MARK: - Integration tests (RNScreens API contract)

@Suite("RNScreens API contract")
struct RNScreensAPIContractTests {

  @Test
  func `tab screen class responds to tabKey`() throws {
    let cls = NSClassFromString("RNSTabsScreenComponentView")
      ?? NSClassFromString("RNSBottomTabsScreenComponentView")
    guard let cls else {
      Issue.record("No tab screen class found — neither RNSTabsScreenComponentView nor RNSBottomTabsScreenComponentView")
      return
    }
    let view = try #require((cls as? UIView.Type)?.init(), "Failed to instantiate tab screen class")
    #expect(view.responds(to: NSSelectorFromString("tabKey")))
  }

  @Test
  func `tab host class responds to controller`() throws {
    let cls = NSClassFromString("RNSTabsHostComponentView")
      ?? NSClassFromString("RNSBottomTabsHostComponentView")
    guard let cls else {
      Issue.record("No tab host class found — neither RNSTabsHostComponentView nor RNSBottomTabsHostComponentView")
      return
    }
    let view = try #require((cls as? UIView.Type)?.init(), "Failed to instantiate tab host class")
    #expect(view.responds(to: NSSelectorFromString("controller")))
  }

  @Test
  func `tab screen class responds to reactViewController`() throws {
    let cls = NSClassFromString("RNSTabsScreenComponentView")
      ?? NSClassFromString("RNSBottomTabsScreenComponentView")
    guard let cls else {
      Issue.record("No tab screen class found")
      return
    }
    let view = try #require((cls as? UIView.Type)?.init(), "Failed to instantiate tab screen class")
    #expect(view.responds(to: NSSelectorFromString("reactViewController")))
  }
}
