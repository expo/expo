// Copyright 2015-present 650 Industries. All rights reserved.

#if os(iOS)
// Also brings in the subclass header, required to set `state` from the touch callbacks
// and to call `ignore(_:for:)` on React Native's touch handler.
import UIKit.UIGestureRecognizerSubclass

/**
  We create a custom gesture recognizer to stop React Root listening to touches when user taps background while Menu is opened.
  Menu when opened attaches a container view `_UIContextMenuContainerView` to the window.
  On tapping it, React Root's `RCTSurfaceTouchHandler` also listens to the touch and causes Pressables to fire onPress.

  It does the same for a touch on a SwiftUI control, so a `Pressable` around the host doesn't fire with the control.
 */
internal final class SystemMenuTouchGate: UIGestureRecognizer, UIGestureRecognizerDelegate {
  init() {
    super.init(target: nil, action: nil)
    // Both default to true. Never hold a touch back, and never let React Native's handler see a
    // reason to cancel: it calls `_cancelTouches` for any outside recognizer that cancels in view.
    delaysTouchesEnded = false
    cancelsTouchesInView = false
    // UIKit asks a recognizer's delegate about an event before it delivers that event's touches.
    delegate = self
  }

  // MARK: - Detecting an open menu

  /**
   The one view UIKit adds to the window for a presented context menu.
   */
  static func isContextMenuContainerClassName(_ className: String) -> Bool {
    return className == "_UI".appending("ContextMenuContainerView")
  }

  /**
    Consider Menu to be open while the container is present and still accepts interaction.
    UIKit turns `isUserInteractionEnabled` off the moment dismissal commits, so taps made during
    the dismiss animation pass through to the app again.
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

  /**
   Tells React Native's handlers to skip these touches while a menu is open, or when a SwiftUI
   control takes them. UIKit then delivers neither `touchesBegan` nor `touchesEnded` for them, so JS
   sees no `touchStart`, no press and no `touchEnd`. A handler that already registered a touch
   cancels it from `reset` at sequence end.
   */
  private func detachSurfaceTouchHandlers(from touches: Set<UITouch>, for event: UIEvent) {
    guard let window = view as? UIWindow else {
      return
    }
    let isShowingContextMenu = Self.isShowingContextMenu(in: window)
    for touch in touches where isShowingContextMenu || Self.isClaimedBySwiftUIControl(touch) {
      for handler in Self.surfaceTouchHandlers(above: touch.view) {
        handler.ignore(touch, for: event)
      }
    }
  }

  // MARK: - Detecting a SwiftUI control

  /**
   Whether the touch landed on SwiftUI content that handles touches, such as a button, toggle or
   text field. UIKit routes the touch to the recognizers of that content, while plain content like
   `Text` gets none. React Native's handler ignores recognizers inside its own views, so without this
   a `Pressable` around the `Host` also fires on the same tap.
   */
  static func isClaimedBySwiftUIControl(_ touch: UITouch) -> Bool {
    guard let host = swiftUIHost(containing: touch.view) else {
      return false
    }
    return touch.gestureRecognizers?.contains { recognizer in
      guard let recognizerView = recognizer.view, recognizerView.isDescendant(of: host) else {
        return false
      }
      // A scroll view's pan doesn't claim a tap.
      return !(recognizer is UIPanGestureRecognizer) && !isSurfaceTouchHandler(recognizer)
    } ?? false
  }

  /**
   The Expo SwiftUI host the touched view belongs to. A React Native view hosted inside it
   (`RNHostView`) is reached first, and its touches stay with React Native.
   */
  static func swiftUIHost(containing view: UIView?) -> UIView? {
    let reactViewClass: AnyClass? = NSClassFromString("RCTViewComponentView")
    var current = view
    while let view = current {
      if view is AnyExpoSwiftUIHostingView {
        return view
      }
      if let reactViewClass, view.isKind(of: reactViewClass) {
        return nil
      }
      current = view.superview
    }
    return nil
  }

  // MARK: - UIGestureRecognizerDelegate

  func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldReceive event: UIEvent) -> Bool {
    if let touches = event.allTouches {
      detachSurfaceTouchHandlers(from: touches.filter { $0.phase == .began }, for: event)
    }
    return true
  }

  // MARK: - UIGestureRecognizer

  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {
    super.touchesBegan(touches, with: event)
    // Second chance in case React Native's handler received the touch before the delegate ran.
    detachSurfaceTouchHandlers(from: touches, for: event)
    state = .failed
  }
}
#endif
