// Copyright 2025-present 650 Industries. All rights reserved.

// iOS-only: ExpoUI.podspec also builds tvOS, and sibling files use `#if os(...)` for
// platform-divergent behavior. The RN touch pass-through this guard fixes is touch-specific,
// so the whole guard compiles out on other platforms.
#if os(iOS)

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
 container being added to the window and disable the RN touch handler(s) in that window
 while it is presented, re-enabling them the moment the menu commits to dismissal.

 Re-enable timing (why not just wait for the container to be removed): the
 `_UIContextMenuContainerView` is only removed at the END of the dismissal animation —
 up to ~1s after the user tapped. If we kept the RN handlers disabled until then, every
 tap in the window would be silently dropped for that whole animation (e.g. tapping a
 menu item and then immediately tapping a button would eat the button tap). Instead we
 re-enable at the earliest SAFE moment: when the container stops being interactive.
 UIKit sets `container.isUserInteractionEnabled = false` (and disables the container's
 own pan recognizer) at the very start of the dismissal animation, which is exactly when
 the menu is no longer accepting input. Re-enabling there is safe for the original
 pass-through bug: the touch that triggered the dismissal began while our handlers were
 disabled, and a gesture recognizer re-enabled mid-sequence is never handed a touch
 sequence already in flight — so that dismiss tap still never reaches RN. Only brand-new
 touches (which the user genuinely intends) get through.

 Detection is scoped to `UIWindow` only (via isa-scoped method swizzling), so no
 overhead is added to ordinary view-hierarchy mutations.

 State is tracked PER-WINDOW and re-derived from the actual hierarchy on every container
 add/remove and on every dismissal-poll tick (self-healing): whether a window's handlers
 should be disabled is decided by live UIKit state, never by a running counter that could
 desync. This keeps multiple windows/scenes independent and recovers automatically if an
 add/remove event is ever missed. `willRemoveSubview` remains a backstop: even if the
 dismissal poll never observed the interactivity flip, container removal still re-derives
 and re-enables.

 Detection has two halves with different robustness. Container detection stays string-based
 (`isContextMenuContainer`) because `_UIContextMenuContainerView` is private with no public
 class to reference. Recognizer detection is TYPED: `ExpoUITouchHandlerHelper.isReactTouchHandler`
 matches the concrete RN touch-handler classes and is shared with the create path, so the
 guard disables exactly the recognizers expo-ui attaches (no substring guesswork).

 KNOWN LIMITATIONS:
 (a) Disabling a recognizer cancels any in-flight RN touch (`touchesCancelled`). A finger
     already down on an RN element at the instant a menu opens can be left in a transient
     stuck-pressed state until the next touch.
 (b) Re-enable is unconditional: it restores every recognizer the guard disabled. A third
     party that deliberately set one of those recognizers' `isEnabled = false` mid-presentation
     would have that override clobbered when the guard re-enables.
 (c) The guard fires for ANY context-menu container, including UIKit's own
     `UIContextMenuInteraction` (not just SwiftUI `Menu`/`.contextMenu`), because the RN
     pass-through bug exists for all of them.
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
    // UIKit swizzling and every piece of guard state below assume the main queue,
    // but the module's `OnCreate` is NOT pinned to it (module registration runs on a
    // background queue in practice — verified in the unified log). So hop rather than
    // assert: a `dispatchPrecondition` here crashes at boot. `installOnce`'s static-let
    // once-semantics make the async hop safe against duplicate installs.
    if Thread.isMainThread {
      _ = installOnce
    } else {
      DispatchQueue.main.async { _ = installOnce }
    }
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
      // Tripwire: reaching this branch means the early dismissal-start poll never fired for
      // this presentation, so the only thing that re-enabled the handlers was the container
      // actually leaving the window. That happens only if the `isUserInteractionEnabled`-flip
      // heuristic the poll relies on never held — our signal that the private-API dismissal
      // timing this guard depends on has shifted under us.
      #if DEBUG
      NSLog("ExpoUIMenuDismissTouchGuard: handlers re-enabled only at container removal — the dismissal-start heuristic never fired; UIKit may have changed the isUserInteractionEnabled timing.")
      #endif
      reEnableHandlers(in: window)
    }
  }

  /// Re-enable and forget the handlers we disabled for `window`, unconditionally (i.e.
  /// even while the context-menu container is still present but no longer interactive —
  /// the early re-enable path). Idempotent: a no-op if nothing is currently disabled.
  fileprivate static func reEnableHandlers(in window: UIWindow) {
    guard let disabled = disabledHandlersByWindow.object(forKey: window) else { return }
    for handler in disabled.allObjects {
      handler.isEnabled = true
    }
    disabledHandlersByWindow.removeObject(forKey: window)
  }

  /// One frame at 60Hz. The poll only needs to comfortably beat the ~250ms dismissal
  /// animation for the re-enable to feel instant, and each tick is a cheap shallow scan
  /// of the window's direct subviews, so a fixed per-frame cadence is plenty on every
  /// display tier. A `CADisplayLink` would align ticks to the real refresh rate but adds
  /// lifecycle to manage (invalidation on teardown) for no user-visible benefit at this
  /// duty cycle.
  private static let dismissalPollInterval: TimeInterval = 1.0 / 60.0

  /// Watch `window` while a menu is presented and re-enable its RN touch handlers the
  /// instant NO context-menu container in it remains interactive — UIKit flips
  /// `isUserInteractionEnabled` to false at the start of the dismissal animation —
  /// rather than waiting for the container to be removed at the end of the animation.
  ///
  /// Deliberately NOT keyed to the single container whose addition scheduled it: if a
  /// second menu opens while the first is still animating out, a container-keyed check
  /// would re-enable the handlers while the new menu is interactive (resurrecting the
  /// pass-through bug for it, since its own poll would then find nothing left to do).
  /// Re-deriving "is ANY container still interactive?" from the live hierarchy each tick
  /// cannot be fooled that way; overlapping presentations just mean two idempotent polls,
  /// the first of which does the work while the other exits on the bookkeeping check.
  ///
  /// Implemented as a self-terminating main-queue poll rather than KVO: it holds `window`
  /// weakly across ticks (no retain cycles, no observer teardown to get wrong), re-derives
  /// from live state each tick, and runs only while a menu is on screen (a brief,
  /// user-initiated window). It stops as soon as any of these is true: the window is gone,
  /// its handlers are no longer ours to re-enable, every container has left the window
  /// (the removal backstop's job), or the re-enable fired.
  private static func scheduleEarlyReEnable(in window: UIWindow) {
    // Opening/dismissing latch, carried across ticks by reference (the nested `poll`
    // captures it): only re-enable once we have actually SEEN a container be interactive.
    // Guards against a UIKit that ADDS the container non-interactive and flips it to
    // interactive a frame later — without the latch the first tick would see
    // "all non-interactive" mid-OPEN and prematurely re-enable, reopening the pass-through
    // bug. Requiring a prior interactive observation means "all non-interactive" can only
    // mean dismissal, never a not-yet-opened menu.
    var sawInteractive = false
    func poll(_ window: UIWindow) {
      // Already re-enabled (early path fired, or removal backstop ran): done.
      guard disabledHandlersByWindow.object(forKey: window) != nil else { return }
      let containers = window.subviews.filter(isContextMenuContainer)
      // Every container is gone: the removal backstop owns re-enabling.
      guard !containers.isEmpty else { return }
      if containers.contains(where: { $0.isUserInteractionEnabled }) {
        sawInteractive = true
      }
      // Every menu on screen has committed to dismissal — nothing accepts input anymore —
      // AND we saw it interactive first, so this is a real dismissal, not a fresh open.
      if sawInteractive, containers.allSatisfy({ !$0.isUserInteractionEnabled }) {
        reEnableHandlers(in: window)
        return
      }
      DispatchQueue.main.asyncAfter(deadline: .now() + dismissalPollInterval) { [weak window] in
        guard let window else { return }
        poll(window)
      }
    }
    DispatchQueue.main.asyncAfter(deadline: .now() + dismissalPollInterval) { [weak window] in
      guard let window else { return }
      poll(window)
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
      for recognizer in recognizers where ExpoUITouchHandlerHelper.isReactTouchHandler(recognizer) {
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

  // Exposed to the UIWindow extension (fileprivate can't reach a private static).
  fileprivate static func onContextMenuContainerAdded(in window: UIWindow) {
    reevaluate(window)
    scheduleEarlyReEnable(in: window)
  }
}

private extension UIWindow {
  @objc func expoui_menuGuard_didAddSubview(_ subview: UIView) {
    self.expoui_menuGuard_didAddSubview(subview) // calls the original (exchanged) impl
    if ExpoUIMenuDismissTouchGuard.isContextMenuContainer(subview) {
      ExpoUIMenuDismissTouchGuard.onContextMenuContainerAdded(in: self)
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

#endif
