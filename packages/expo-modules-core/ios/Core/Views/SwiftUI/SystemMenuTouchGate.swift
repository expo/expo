// Copyright 2015-present 650 Industries. All rights reserved.

#if os(iOS)
// Also brings in the subclass header, required to set `state` from the touch callbacks.
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
    return className == "_UIContextMenuContainerView"
  }

  /**
    Consider Menu to be open when container view is present and interaction on it is enabled.
   */
  static func isOpenContextMenuContainer(className: String, isUserInteractionEnabled: Bool) -> Bool {
    return isUserInteractionEnabled && isContextMenuContainerClassName(className)
  }

  static func isContextMenuContainer(_ view: UIView) -> Bool {
    return isOpenContextMenuContainer(
      className: NSStringFromClass(type(of: view)),
      isUserInteractionEnabled: view.isUserInteractionEnabled
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

  /**
  Cancels touches by disabling and re-enabling the gesture recognizer. This is the same approach React Native uses in
  RCTSurfaceTouchHandler.mm.
  https://github.com/react/react-native/blob/3a95e0e93c80537d519dd7e9a771544396d4ab6b/packages/react-native/React/Fabric/RCTSurfaceTouchHandler.mm#L414
   */
  static func cancelReactNativeTouches(in view: UIView) {
    for recognizer in view.gestureRecognizers ?? []
    where isSurfaceTouchHandlerClassName(NSStringFromClass(type(of: recognizer))) {
      recognizer.isEnabled = false
      recognizer.isEnabled = true
    }
    for subview in view.subviews {
      cancelReactNativeTouches(in: subview)
    }
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
      Self.cancelReactNativeTouches(in: window)
    }
    state = .failed
  }
}
#endif
