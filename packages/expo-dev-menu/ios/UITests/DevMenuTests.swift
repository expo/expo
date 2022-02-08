//import XCTest
//import UIKit
//
//@testable import EXDevMenu
//@testable import EXDevMenuInterface
//
//class MockedExtension: DevMenuExtensionProtocol {
//  static func moduleName() -> String! {
//    return "MockedExtension"
//  }
//
//  let action: () -> Void
//  init(withAction action: @escaping () -> Void) {
//    self.action = action
//  }
//
//  func devMenuItems(_ settings: DevMenuExtensionSettingsProtocol) -> DevMenuItemsContainerProtocol? {
//    let container = DevMenuItemsContainer()
//
//    let action = DevMenuAction(withId: "action", action: action)
//    action.label = { "Action" }
//
//    container.addItem(action)
//
//    return container
//  }
//}
//
//
//class TestInterceptorFirstLaunch: DevMenuTestInterceptor {
//  @objc
//  var shouldShowAtLaunch: Bool { get { return true } }
//
//  @objc
//  var isOnboardingFinishedKey: Bool { get { return false } }
//}
//
//class TestInterceptorOnboardingFinished: DevMenuTestInterceptor {
//  @objc
//  var shouldShowAtLaunch: Bool { get { return false } }
//
//  @objc
//  var isOnboardingFinishedKey: Bool { get { return true } }
//}
//
//class DevMenuTests: XCTestCase {
//  override func setUp() {
//    XCTAssertFalse(DevMenuManager.shared.isVisible)
//  }
//
//  override func tearDown() {
//    if DevMenuManager.shared.isVisible {
//      DevMenuManager.shared.hideMenu()
//      DevMenuLooper.runMainLoopUntilEmpty()
//    }
//  }
//
//  func test_if_dev_menu_is_rendered() {
//    DevMenuManager.shared.currentBridge = UIMockedNOOPBridge(delegate: nil, launchOptions: nil)
//
//    DevMenuManager.shared.openMenu()
//    waitForDevMenu()
//
//    assertViewExists(text: "AppHost-expo-dev-menu-Unit-Tests")
//    assertViewExists(text: "Version:")
//    assertViewExists(text: "1")
//    assertViewExists(text: "Host:")
//    assertViewExists(text: "localhost:1234")
//    assertViewExists(text: "JS Engine:")
//  }
//
//  func test_dev_menu_auto_launch() {
//    DevMenuTestInterceptorManager.setTestInterceptor(TestInterceptorFirstLaunch())
//    DevMenuManager.shared.currentBridge = UIMockedNOOPBridge(delegate: nil, launchOptions: nil)
//    waitForDevMenu()
//    DevMenuTestInterceptorManager.setTestInterceptor(nil)
//  }
//
//  func test_dev_menu_auto_launch_bypass() {
//    DevMenuTestInterceptorManager.setTestInterceptor(TestInterceptorFirstLaunch())
//    UserDefaults.standard.set(true, forKey: "EXDevMenuDisableAutoLaunch")
//    DevMenuManager.shared.readAutoLaunchDisabledState()
//
//    let label = UILabel()
//    label.text = "Test App"
//    label.bounds = CGRect(x: 0, y: 0, width: 100, height: 100)
//    label.accessibilityIdentifier = "TestApp"
//    UIApplication.shared.keyWindow!.rootViewController!.view.addSubview(label)
//    waitForView(tag: "TestApp")
//
//    DevMenuManager.shared.currentBridge = UIMockedNOOPBridge(delegate: nil, launchOptions: nil)
//    runMainLoop(for: 1)
//
//    XCTAssertNil(DevMenuUIMatchers.findView(tag: DevMenuViews.mainScreen))
//    XCTAssertNil(DevMenuUIMatchers.findView(tag: DevMenuViews.footer))
//    XCTAssertFalse(DevMenuManager.shared.isVisible)
//
//    // clean up
//    DevMenuManager.shared.toggleMenu()
//    waitForDevMenu()
//    UserDefaults.standard.set(false, forKey: "EXDevMenuDisableAutoLaunch")
//    DevMenuManager.shared.readAutoLaunchDisabledState()
//    DevMenuTestInterceptorManager.setTestInterceptor(nil)
//  }
//
//  func test_if_dev_menu_can_be_toggled() {
//    let label = UILabel()
//    label.text = "Test App"
//    label.bounds = CGRect(x: 0, y: 0, width: 100, height: 100)
//    label.accessibilityIdentifier = "TestApp"
//    UIApplication.shared.keyWindow!.rootViewController!.view.addSubview(label)
//
//    waitForView(tag: "TestApp")
//    DevMenuManager.shared.currentBridge = UIMockedNOOPBridge(delegate: nil, launchOptions: nil)
//
//    DevMenuManager.shared.toggleMenu()
//    waitForDevMenu()
//
//    DevMenuManager.shared.toggleMenu()
//    waitForView(tag: "TestApp")
//
//    DevMenuManager.shared.toggleMenu()
//    waitForDevMenu()
//  }
//
//  func test_if_extension_is_exported() {
//    XCTAssertFalse(DevMenuManager.shared.isVisible)
//    let expectation = expectation(description: "Action should be called.")
//    let mockedExtension = MockedExtension {
//      expectation.fulfill()
//    }
//    let mockedBridge = BridgeWithDevMenuExtension(delegate: nil, launchOptions: nil)!
//    mockedBridge.extensions.append(mockedExtension)
//
//    DevMenuManager.shared.currentBridge = UIMockedNOOPBridge(delegate: nil, launchOptions: nil)
//    DevMenuManager.shared.openMenu()
//    waitForDevMenu()
//
//    let actionView = DevMenuUIMatchers.waitForView(text: "Action")
//    XCTAssertNotNil(actionView)
//    // TODO: (@lukmccall) generate a press event
//    DevMenuManager.shared.dispatchCallable(withId: "action", args: nil)
//
//    waitForExpectations(timeout: 0)
//  }
//
//  func test_if_menu_can_be_opened_on_settings_screen() {
//    DevMenuTestInterceptorManager.setTestInterceptor(TestInterceptorOnboardingFinished())
//    DevMenuManager.shared.currentBridge = UIMockedNOOPBridge(delegate: nil, launchOptions: nil)
//    DevMenuManager.shared.openMenu("Settings")
//
//    waitForView(tag: DevMenuViews.settingsScreen)
//    waitForView(tag: DevMenuViews.footer)
//    XCTAssertTrue(DevMenuManager.shared.isVisible)
//    DevMenuTestInterceptorManager.setTestInterceptor(nil)
//  }
//}
