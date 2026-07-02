// Copyright 2025-present 650 Industries. All rights reserved.

import UIKit
import ObjectiveC.runtime

/**
 Fixes: tapping OUTSIDE an open SwiftUI `Menu` / `.contextMenu` to dismiss it also
 fires the React Native view under the tap (the dismiss tap "passes through").

 Root cause: when the menu opens, iOS inserts a `_UIContextMenuContainerView` at the
 window level. UIKit blocks other UIKit controls behind it, but does NOT block React
 Native's touch handler (`RCTSurfaceTouchHandler` on Fabric / `RCTTouchHandler` on
 Paper) — it is a `UIGestureRecognizer` on the RN surface, so the tap still reaches RN.

 SwiftUI `Menu` exposes no present/dismiss callback, so we detect the context-menu
 container being added to / removed from the window and disable the RN touch handler(s)
 in that window while it is presented, re-enabling them when it goes away.

 Detection is scoped to `UIWindow` only (via isa-scoped method swizzling), so no
 overhead is added to ordinary view-hierarchy mutations.

 State is tracked PER-WINDOW and re-derived from the actual hierarchy on every container
 add/remove (self-healing): whether a window's handlers should be disabled is decided by
 "does this window currently contain a context-menu container?", never by a running
 counter that could desync. This keeps multiple windows/scenes independent and recovers
 automatically if an add/remove event is ever missed.
 */
@objc public final class ExpoUIMenuDismissTouchGuard: NSObject {
  // Per-window record of the RN touch handlers we disabled while a menu is presented in
  // that window. Weak keys so windows/scenes are never retained; the recognizers inside
  // each table are weak too. A key being present means "this window's handlers are
  // currently disabled by us".
  private static let disabledHandlersByWindow =
    NSMapTable<UIWindow, NSHashTable<UIGestureRecognizer>>.weakToStrongObjects()

  /// Installs the detection once, atomically, no matter how many times it is called
  /// (e.g. from the module's `OnCreate`). `static let` gives us `dispatch_once` semantics.
  private static let installOnce: Void = {
    scopedSwizzle(#selector(UIView.didAddSubview(_:)), #selector(UIWindow.expoui_menuGuard_didAddSubview(_:)))
    scopedSwizzle(#selector(UIView.willRemoveSubview(_:)), #selector(UIWindow.expoui_menuGuard_willRemoveSubview(_:)))
  }()

  @objc public static func install() {
    _ = installOnce
  }

  fileprivate static func isContextMenuContainer(_ view: UIView) -> Bool {
    return String(describing: type(of: view)).contains("ContextMenuContainer")
  }

  /// Drive `window`'s handlers to match reality: disabled iff the window still contains a
  /// context-menu container. Idempotent and self-healing. `ignoring` is the subview about
  /// to be removed (still present in `window.subviews` during `willRemoveSubview`), so it
  /// must be excluded from the "is a menu still open?" check.
  fileprivate static func reevaluate(_ window: UIWindow, ignoring ignored: UIView? = nil) {
    let menuPresented = windowContainsContextMenuContainer(window, ignoring: ignored)
    let alreadyDisabled = disabledHandlersByWindow.object(forKey: window) != nil

    if menuPresented, !alreadyDisabled {
      let disabled = NSHashTable<UIGestureRecognizer>.weakObjects()
      var handlers = [UIGestureRecognizer]()
      collectReactTouchHandlers(in: window, into: &handlers)
      for handler in handlers where handler.isEnabled {
        handler.isEnabled = false
        disabled.add(handler)
      }
      disabledHandlersByWindow.setObject(disabled, forKey: window)
    } else if !menuPresented, alreadyDisabled {
      if let disabled = disabledHandlersByWindow.object(forKey: window) {
        for handler in disabled.allObjects {
          handler.isEnabled = true
        }
      }
      disabledHandlersByWindow.removeObject(forKey: window)
    }
  }

  // The context-menu container is added as a direct child of the window, so a shallow
  // scan of the window's own subviews is enough (and cheap).
  private static func windowContainsContextMenuContainer(_ window: UIWindow, ignoring ignored: UIView?) -> Bool {
    for subview in window.subviews where subview !== ignored {
      if isContextMenuContainer(subview) {
        return true
      }
    }
    return false
  }

  private static func collectReactTouchHandlers(in view: UIView, into acc: inout [UIGestureRecognizer]) {
    if let recognizers = view.gestureRecognizers {
      for recognizer in recognizers where String(describing: type(of: recognizer)).contains("TouchHandler") {
        acc.append(recognizer)
      }
    }
    for subview in view.subviews {
      collectReactTouchHandlers(in: subview, into: &acc)
    }
  }

  /// Swizzle `original` (declared on `UIView`) with `replacement` (declared on
  /// `UIWindow`) so ONLY `UIWindow` instances are affected. If `UIView`'s impl is
  /// inherited (not overridden by `UIWindow`) we first give `UIWindow` its own copy,
  /// then exchange — leaving every other `UIView` untouched.
  private static func scopedSwizzle(_ original: Selector, _ replacement: Selector) {
    let cls = UIWindow.self
    guard let replacementMethod = class_getInstanceMethod(cls, replacement),
          let inheritedMethod = class_getInstanceMethod(cls, original) else {
      return
    }
    let added = class_addMethod(
      cls,
      original,
      method_getImplementation(inheritedMethod),
      method_getTypeEncoding(inheritedMethod)
    )
    if added, let ownMethod = class_getInstanceMethod(cls, original) {
      method_exchangeImplementations(ownMethod, replacementMethod)
    } else {
      method_exchangeImplementations(inheritedMethod, replacementMethod)
    }
  }
}

private extension UIWindow {
  @objc func expoui_menuGuard_didAddSubview(_ subview: UIView) {
    self.expoui_menuGuard_didAddSubview(subview) // calls the original (exchanged) impl
    if ExpoUIMenuDismissTouchGuard.isContextMenuContainer(subview) {
      ExpoUIMenuDismissTouchGuard.reevaluate(self)
    }
  }

  @objc func expoui_menuGuard_willRemoveSubview(_ subview: UIView) {
    if ExpoUIMenuDismissTouchGuard.isContextMenuContainer(subview) {
      // `subview` is still in `self.subviews` here — exclude it from the scan.
      ExpoUIMenuDismissTouchGuard.reevaluate(self, ignoring: subview)
    }
    self.expoui_menuGuard_willRemoveSubview(subview) // calls the original (exchanged) impl
  }
}
