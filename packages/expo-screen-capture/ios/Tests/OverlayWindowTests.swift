// Copyright 2026-present 650 Industries. All rights reserved.

import Testing
import UIKit

@testable import ExpoScreenCapture

@Suite("OverlayWindow", .serialized)
@MainActor
struct OverlayWindowTests {
  private func makeKeyWindow() -> UIWindow {
    let window = UIWindow(frame: UIScreen.main.bounds)
    window.rootViewController = UIViewController()
    window.makeKeyAndVisible()
    return window
  }

  @Test
  func `overlay is a separate visible window layered above the key window`() {
    let keyWindow = makeKeyWindow()

    let overlay = OverlayWindow(above: keyWindow)

    #expect(overlay.window !== keyWindow)
    #expect(!overlay.contentView.isDescendant(of: keyWindow))
    #expect(overlay.window.windowLevel > keyWindow.windowLevel)
    #expect(!overlay.window.isHidden)
    #expect(overlay.window.frame == keyWindow.frame)
  }

  @Test
  func `overlay stays above content added to the key window after it was created`() throws {
    let keyWindow = makeKeyWindow()
    let root = try #require(keyWindow.rootViewController)
    let overlay = OverlayWindow(above: keyWindow)

    // Stands in for a presented view controller, which UIKit hosts as a sibling of the root view.
    let presentedContent = UIView(frame: keyWindow.bounds)
    keyWindow.addSubview(presentedContent)

    #expect(presentedContent.window === keyWindow)
    #expect(!presentedContent.isDescendant(of: root.view))
    #expect(!overlay.contentView.isDescendant(of: keyWindow))
    #expect(overlay.window.windowLevel > keyWindow.windowLevel)
  }

  @Test
  func `dismiss hides the overlay window`() {
    let keyWindow = makeKeyWindow()
    let overlay = OverlayWindow(above: keyWindow)

    overlay.dismiss()

    #expect(overlay.window.isHidden)
  }
}
