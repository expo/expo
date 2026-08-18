// Copyright 2015-present 650 Industries. All rights reserved.

#if os(iOS)
// Also brings in the subclass header, required to set `state` from the touch callbacks
// and to call `ignore(_:for:)` on React Native's touch handler.
import UIKit.UIGestureRecognizerSubclass

/**
  We create a custom gesture recognizer to stop React Root listening to touches when user taps background while Menu is opened.
  Menu when opened attaches a container view `_UIContextMenuContainerView` to the window.
  On tapping it, React Root's `RCTSurfaceTouchHandler` also listens to the touch and causes Pressables to fire onPress.
 */
internal final class SystemMenuTouchGate: UIGestureRecognizer {
  init() {
    super.init(target: nil, action: nil)
    // Both default to true. Never hold a touch back, and never let React Native's handler see a
    // reason to cancel: it calls `_cancelTouches` for any outside recognizer that cancels in view.
    delaysTouchesEnded = false
    cancelsTouchesInView = false
  }

  // MARK: - Detecting an open menu

  /**
   The one view UIKit adds to the window for a presented context menu.
   */
  static func isContextMenuContainerClassName(_ className: String) -> Bool {
    return className == "_UI".appending("ContextMenuContainerView")
  }

  /**
    Consider Menu to be open when the container is present, still accepts interaction, and is modal.
    UIKit turns `isUserInteractionEnabled` off the moment dismissal commits, so taps made during
    the dismiss animation pass through to the app again. `accessibilityViewIsModal` is how UIKit
    marks the container as blocking the content behind it — a semantic signal beside the class name.
   */
  static func isOpenContextMenuContainer(
    className: String,
    isUserInteractionEnabled: Bool,
    accessibilityViewIsModal: Bool
  ) -> Bool {
    return isUserInteractionEnabled && accessibilityViewIsModal && isContextMenuContainerClassName(className)
  }

  static func isContextMenuContainer(_ view: UIView) -> Bool {
    return isOpenContextMenuContainer(
      className: NSStringFromClass(type(of: view)),
      isUserInteractionEnabled: view.isUserInteractionEnabled,
      accessibilityViewIsModal: view.accessibilityViewIsModal
    )
  }

  /**
   UIKit adds the container as a direct subview of the window, above the app's content, so only the
   window's own subviews are worth checking. Anything deeper belongs to the app itself.
   */
  static func isShowingContextMenu(
    in window: UIWindow,
    isContainer: @MainActor (UIView) -> Bool = SystemMenuTouchGate.isContextMenuContainer
  ) -> Bool {
    for subview in window.subviews where isContainer(subview) {
      return true
    }
    return false
  }

  // MARK: - Cancelling React Native's touches

  /**
   Matched by name so that this file needs no React Native headers.
   */
  static func isSurfaceTouchHandlerClassName(_ className: String) -> Bool {
    return className == "RCTSurfaceTouchHandler"
  }

  static func isSurfaceTouchHandler(_ recognizer: UIGestureRecognizer) -> Bool {
    return isSurfaceTouchHandlerClassName(NSStringFromClass(type(of: recognizer)))
  }

  /**
   React Native's touch handlers along the touched view's superview chain.
   */
  static func surfaceTouchHandlers(
    above view: UIView?,
    isSurfaceTouchHandler: @MainActor (UIGestureRecognizer) -> Bool = SystemMenuTouchGate.isSurfaceTouchHandler
  ) -> [UIGestureRecognizer] {
    var handlers: [UIGestureRecognizer] = []
    var current = view
    while let view = current {
      for recognizer in view.gestureRecognizers ?? [] where isSurfaceTouchHandler(recognizer) {
        handlers.append(recognizer)
      }
      current = view.superview
    }
    return handlers
  }

  // MARK: - Installing

  /**
   Adds one gate to the window. The window owns it for as long as it lives, and the gate stays
   inert until a menu is actually open, so there is nothing to tear down per host.
   */
  static func install(in window: UIWindow) {
    let isInstalled = window.gestureRecognizers?.contains { $0 is SystemMenuTouchGate } ?? false
    guard !isInstalled else {
      return
    }
    window.addGestureRecognizer(SystemMenuTouchGate())
  }

  // MARK: - UIGestureRecognizer

  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {
    super.touchesBegan(touches, with: event)

    if let window = view as? UIWindow, Self.isShowingContextMenu(in: window) {
      for touch in touches {
        for handler in Self.surfaceTouchHandlers(above: touch.view) {
          handler.ignore(touch, for: event)
        }
      }
    }
    state = .failed
  }
}
#endif
