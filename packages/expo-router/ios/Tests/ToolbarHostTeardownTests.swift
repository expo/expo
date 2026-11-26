import RNScreens
import Testing
import UIKit

@testable import ExpoRouter

@Suite("Toolbar host teardown")
@MainActor
struct ToolbarHostTeardownTests {
  @available(iOS 18.0, *)
  @Test
  func `popped toolbar screen hides the toolbar and the next screen shows its own button`() async throws {
    let navigation = UINavigationController(rootViewController: UIViewController())
    let window = makeWindow(rootViewController: navigation)
    defer { window.isHidden = true }

    let (firstScreen, firstHost, delete) = try pushToolbarScreen(on: navigation, icon: "trash")
    await flushToolbarUpdate()
    try #require(!navigation.isToolbarHidden)
    try #require(firstScreen.toolbarItems == [delete.barButtonItem])

    // UIKit detaches the popped screen from the stack before its views leave the window.
    navigation.popViewController(animated: false)
    window.layoutIfNeeded()
    try #require(firstScreen.navigationController == nil)
    try #require(firstHost.window == nil)

    #expect(navigation.isToolbarHidden)

    let (secondScreen, _, share) = try pushToolbarScreen(on: navigation, icon: "square.and.arrow.up")
    await flushToolbarUpdate()
    #expect(!navigation.isToolbarHidden)
    #expect(secondScreen.toolbarItems == [share.barButtonItem])
    #expect(secondScreen.toolbarItems?.first?.image == UIImage(systemName: "square.and.arrow.up"))
  }

  private func makeWindow(rootViewController: UIViewController) -> UIWindow {
    let window: UIWindow
    if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene {
      window = UIWindow(windowScene: scene)
    } else {
      window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
    }
    window.rootViewController = rootViewController
    window.makeKeyAndVisible()
    return window
  }

  private func pushToolbarScreen(
    on navigation: UINavigationController,
    icon: String
  ) throws -> (UIViewController, RouterToolbarHostView, RouterToolbarItemView) {
    let screenView = RNSScreenView(frame: .zero)
    let screen = try #require(screenView.reactViewController())
    navigation.pushViewController(screen, animated: false)

    let host = RouterToolbarHostView(appContext: nil)
    screenView.addSubview(host)
    let item = RouterToolbarItemView(appContext: nil)
    item.identifier = "action"
    item.systemImageName = icon
    host.mountChildComponentView(item, index: 0)
    return (screen, host, item)
  }

  // RouterToolbarHostView batches item updates on the main queue.
  private func flushToolbarUpdate() async {
    await withCheckedContinuation { continuation in
      DispatchQueue.main.async { continuation.resume() }
    }
  }
}
