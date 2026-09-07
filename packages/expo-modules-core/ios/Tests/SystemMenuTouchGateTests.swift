// Copyright 2026-present 650 Industries. All rights reserved.

#if os(iOS)

import Testing
import UIKit

@testable import ExpoModulesCore

private final class FakeSurfaceTouchHandler: UIGestureRecognizer {}

@Suite("SystemMenuTouchGate")
@MainActor
struct SystemMenuTouchGateTests {
  // MARK: - Detecting an open menu

  @Test
  func `matches the context menu container class name`() {
    #expect(SystemMenuTouchGate.isContextMenuContainerClassName("_UIContextMenuContainerView"))
    #expect(!SystemMenuTouchGate.isContextMenuContainerClassName("UIView"))
  }

  @Test
  func `container counts as open only while interactive and modal`() {
    let container = "_UIContextMenuContainerView"

    #expect(SystemMenuTouchGate.isOpenContextMenuContainer(
      className: container, isUserInteractionEnabled: true, accessibilityViewIsModal: true
    ))
    // UIKit disables interaction the moment dismissal commits, so taps made
    // during the dismiss animation must pass through to the app again.
    #expect(!SystemMenuTouchGate.isOpenContextMenuContainer(
      className: container, isUserInteractionEnabled: false, accessibilityViewIsModal: true
    ))
    // The real container blocks the content behind it. A non-modal look-alike is not menu chrome.
    #expect(!SystemMenuTouchGate.isOpenContextMenuContainer(
      className: container, isUserInteractionEnabled: true, accessibilityViewIsModal: false
    ))
    #expect(!SystemMenuTouchGate.isOpenContextMenuContainer(
      className: "UITransitionView", isUserInteractionEnabled: true, accessibilityViewIsModal: true
    ))
  }

  @Test
  func `only the window's direct subviews are checked for the container`() {
    let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 100, height: 100))
    let child = UIView()
    let grandchild = UIView()
    window.addSubview(child)
    child.addSubview(grandchild)

    #expect(SystemMenuTouchGate.isShowingContextMenu(in: window, isContainer: { $0 === child }))
    #expect(!SystemMenuTouchGate.isShowingContextMenu(in: window, isContainer: { $0 === grandchild }))
  }

  // MARK: - Keeping the touch away from React Native

  @Test
  func `matches React Native's touch handler by class name`() {
    #expect(SystemMenuTouchGate.isSurfaceTouchHandlerClassName("RCTSurfaceTouchHandler"))
    #expect(!SystemMenuTouchGate.isSurfaceTouchHandlerClassName("UITapGestureRecognizer"))
  }

  @Test
  func `finds handlers on the touched view's superview chain`() {
    let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 100, height: 100))
    let surface = UIView()
    let content = UIView()
    window.addSubview(surface)
    surface.addSubview(content)

    let handler = FakeSurfaceTouchHandler()
    surface.addGestureRecognizer(handler)

    let found = SystemMenuTouchGate.surfaceTouchHandlers(
      above: content,
      isSurfaceTouchHandler: { $0 is FakeSurfaceTouchHandler }
    )

    #expect(found.count == 1)
    #expect(found.first === handler)
  }

  @Test
  func `skips handlers outside the touched view's chain`() {
    let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 100, height: 100))
    let touchedBranch = UIView()
    let otherBranch = UIView()
    window.addSubview(touchedBranch)
    window.addSubview(otherBranch)

    let otherHandler = FakeSurfaceTouchHandler()
    otherBranch.addGestureRecognizer(otherHandler)

    let found = SystemMenuTouchGate.surfaceTouchHandlers(
      above: touchedBranch,
      isSurfaceTouchHandler: { $0 is FakeSurfaceTouchHandler }
    )

    #expect(found.isEmpty)
  }

  // MARK: - Acting before the touch is delivered

  /**
   UIKit asks a recognizer's delegate about an event before it delivers that event's touches, and
   React Native's handler sends `touchStart` to JS from inside `touchesBegan`. Being its own
   delegate is what lets the gate detach the touch before that happens.
   */
  @Test
  func `is its own delegate`() {
    let gate = SystemMenuTouchGate()
    #expect(gate.delegate === gate)
  }

  @Test
  func `never keeps an event from itself`() {
    let gate = SystemMenuTouchGate()
    #expect(gate.gestureRecognizer(gate, shouldReceive: UIEvent()))
  }

  @Test
  func `installs one gate per window`() {
    let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 100, height: 100))
    SystemMenuTouchGate.install(in: window)
    SystemMenuTouchGate.install(in: window)

    let gates = window.gestureRecognizers?.filter { $0 is SystemMenuTouchGate } ?? []
    #expect(gates.count == 1)
  }
}
#endif
