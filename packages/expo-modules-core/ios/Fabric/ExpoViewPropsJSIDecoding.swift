// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import QuartzCore

/// An opaque container of view-prop values that were decoded straight from their JavaScript
/// values on the JavaScript thread (see the JSI view-props decoding design).
///
/// The decoded values are arbitrary Swift values (primitives, records, shared object
/// references, …), so they cannot be bridged through an `NSDictionary`. Instead this class is
/// passed back to native as an opaque `NSObject` and unboxed again in Swift when applying the
/// props to the view on the main thread.
@objc(EXDecodedViewProps)
public final class DecodedViewProps: NSObject {
  // `nonisolated(unsafe)` because the values are produced on the JS thread and read on the
  // main thread; the design guarantees only thread-safe (detached) values land here, and the
  // two accesses never overlap (decode fully completes before apply begins).
  nonisolated(unsafe) internal let values: [String: Any]

  internal init(values: [String: Any]) {
    self.values = values
  }
}

/// Decodes Fabric view props straight from their JavaScript values on the JavaScript thread.
///
/// This is a standalone, **non-`@MainActor`** type on purpose: `ExpoFabricView` is a `UIView`
/// subclass and therefore main-actor-isolated, so a method on it could not be called from the
/// JS (props-parse) thread without tripping the main-actor isolation check. The registry of
/// prop definitions is keyed by the dynamic view class name and guarded by a mutex because it's
/// written on the main thread (during component registration) and read on the JS thread (during
/// props parsing).
@objc(EXViewPropsJSIDecoder)
public final class ViewPropsJSIDecoder: NSObject {
  /// Maps a dynamic view class name to its prop definitions. Written on the main thread (once per
  /// view, at module-registration time) and read on the JavaScript thread (per Fabric props-parse),
  /// so it's guarded by a `Mutex`.
  private static let registry = Mutex<[String: [String: AnyViewProp]]>([:])

  /// Optional observer invoked once per decode pass, on the JavaScript thread, with the elapsed
  /// seconds and the number of props decoded. Used to benchmark the JS-thread decode without
  /// wiring timing into the decode path: when this is `nil` (the default) decoding doesn't even
  /// read the clock. Set it from a benchmark harness.
  ///
  /// `@JavaScriptActor`-isolated because it's invoked from `decodeProps` while isolated to the
  /// JavaScript actor; the type makes that contract explicit and lets the closure body be
  /// checked against it.
  nonisolated(unsafe) public static var onDecodePass: (@JavaScriptActor (_ seconds: Double, _ propCount: Int) -> Void)?

  /// Registers the prop definitions for the given dynamic view class name, so props can be
  /// resolved at Fabric props-parse time (before any view instance exists). Runs at
  /// module-registration time (`AppContext.registerNativeViews`).
  @MainActor
  public static func register(propsDict: [String: AnyViewProp], forClassName className: String) {
    registry.withLock { entries in
      entries[className] = propsDict
    }
  }

  /// Decodes JSI-backed view props on the JavaScript thread.
  ///
  /// Called from the Objective-C++ decode shim during Fabric props parsing. Resolves the prop
  /// definitions for `className`, reads each declared prop's value off the props object, decodes
  /// it through the regular dynamic-type machinery, and returns the decoded values boxed in a
  /// `DecodedViewProps`. Props not declared by the view (inherited base-view / Yoga props), or
  /// that fail to decode, are skipped here and left for the legacy main-thread dictionary path.
  ///
  /// - Parameters:
  ///   - className: the dynamic view class name used to resolve the prop definitions.
  ///   - appContext: the app context whose runtime owns `propsObjectPointer`.
  ///   - propsObjectPointer: a raw pointer to the props object as a `facebook::jsi::Value`.
  /// - Returns: a `DecodedViewProps`, or `nil` if there's nothing to decode.
  ///
  /// Must be called on the JavaScript thread.
  @objc
  public static func decodeProps(
    forClassName className: String,
    appContext: AppContext,
    propsObjectPointer: UnsafeRawPointer
  ) -> DecodedViewProps? {
    guard let propsDict = registry.withLock({ $0[className] }) else {
      return nil
    }
    guard let runtime = try? appContext.runtime else {
      return nil
    }

    // Gate on the reliable pthread-id check rather than `JavaScriptActor`'s thread-*name*
    // heuristic: Fabric's props-parse thread is the JS pthread, but `NSThread.current.name`
    // isn't set there. If for any reason we're not on the JS thread, bail to the legacy path.
    guard runtime.isOnJavaScriptThread() else {
      return nil
    }

    // `assumeIsolatedOnJavaScriptThread` runs the closure synchronously on the current thread
    // (no hop), so these captures don't actually escape. They aren't `Sendable`, so silence
    // Swift 6's conservative cross-isolation check explicitly.
    nonisolated(unsafe) let unsafePropsPointer = propsObjectPointer
    nonisolated(unsafe) let unsafePropsDict = propsDict

    return runtime.assumeIsolatedOnJavaScriptThread {
      // Only sample the clock when an observer is attached, so production decoding pays nothing.
      let observer = ViewPropsJSIDecoder.onDecodePass
      let decodeStart = observer != nil ? CACurrentMediaTime() : 0

      let propsValue = JavaScriptValue(runtime, unsafeValuePointer: unsafePropsPointer)

      guard propsValue.isObject() else {
        return nil
      }
      let propsObject = propsValue.getObject()

      // Iterate the props object's OWN keys, not the full prop definition list. On a Fabric
      // update the rawProps object holds only the props that changed (it's the diff React
      // passes to `cloneNodeWithNewProps`), so this scales with the number of changed props
      // rather than the total number of declared props, a win for wide views where only a
      // few props change per update. (At initial mount the object holds all props.)
      let changedKeys = propsObject.getPropertyNames()

      var decoded: [String: Any] = [:]

      for key in changedKeys {
        guard let prop = unsafePropsDict[key] else {
          // Not a prop the view declares (e.g. inherited base-view / Yoga props). Those are
          // handled by React Native's own view, not the Expo decoder, so skip it here.
          continue
        }
        let propValue = propsObject.getProperty(key)

        do {
          decoded[key] = try prop.decode(jsValue: propValue, appContext: appContext)
        } catch {
          // The value couldn't be decoded; skip it. It isn't applied this update (the JSI
          // descriptor builds no `propsMap`, so there's no dictionary fallback) and will apply
          // on a later update if it changes again and decodes. Log it (mirroring the apply-side
          // catch) so a prop that consistently fails to decode is at least observable.
          log.error("Decoding prop '\(key)' from its JavaScript value failed: \(error.localizedDescription)")
          continue
        }
      }

      observer?(CACurrentMediaTime() - decodeStart, decoded.count)

      if decoded.isEmpty {
        return nil
      }
      return DecodedViewProps(values: decoded)
    }
  }
}
