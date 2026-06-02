// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation
import ObjectiveC
import ExpoModulesCore

/**
 Swizzles `+[URLSessionConfiguration default]` and `+[URLSessionConfiguration ephemeral]` so the
 returned configurations include `NetworkRequestURLProtocol` at the head of `protocolClasses`.

 Without this, only sessions explicitly built with `protocolClasses` set (or `URLSession.shared`)
 are observed. Many third-party SDKs and React Native's networking layer construct a fresh
 configuration via `URLSessionConfiguration.default`, then mutate it — swizzling the factory makes
 those copies inherit our class.

 ## Why class-method swizzling

 `URLSessionConfiguration.default` is a class method that returns a fresh configuration each call.
 We can't subclass `URLSessionConfiguration` usefully (Foundation hands back its private
 `__NSCFURLSessionConfiguration` subclass), so we swap the implementation of the factory itself.

 ## Idempotency

 `install` is one-way and guarded by a `Mutex` that also protects every subsequent read of the
 captured original IMPs. Repeat calls do nothing, so it's safe to call from app launch
 unconditionally.
 */
enum NetworkRequestConfigurationSwizzling {
  /**
   Installs the swizzles. Should be called once early in app launch — after `URLProtocol.registerClass`
   for symmetry, but before any other code constructs a `URLSessionConfiguration`.
   */
  static func install(protocolClass: AnyClass) {
    state.withLock { state in
      if state.installed {
        return
      }
      state.installed = true
      state.protocolClass = protocolClass

      let target: AnyClass = URLSessionConfiguration.self
      for kind in [Kind.default, Kind.ephemeral] {
        guard let method = class_getClassMethod(target, kind.selector) else {
          continue
        }
        let block: @convention(block) (AnyObject) -> URLSessionConfiguration? = { _ in
          return invokeOriginal(kind)
        }
        let imp = imp_implementationWithBlock(block as Any)
        let original = method_setImplementation(method, imp)
        switch kind {
        case .default:
          state.originalDefault = original
        case .ephemeral:
          state.originalEphemeral = original
        }
      }
    }
  }

  // MARK: - Implementation

  private struct InstallationState {
    var installed = false
    var protocolClass: AnyClass?
    var originalDefault: IMP?
    var originalEphemeral: IMP?
  }

  private static let state = Mutex<InstallationState>(InstallationState())

  private enum Kind: String {
    case `default` = "defaultSessionConfiguration"
    case ephemeral = "ephemeralSessionConfiguration"

    var selector: Selector {
      return NSSelectorFromString(rawValue)
    }
  }

  private typealias FactoryFn = @convention(c) (AnyObject, Selector) -> URLSessionConfiguration?

  /**
   Replacement implementation that the swizzled `+defaultSessionConfiguration`/
   `+ephemeralSessionConfiguration` selectors dispatch to. Calls the captured original IMP to
   produce a fresh configuration, then injects our protocol class into it. The lock is held only
   long enough to snapshot the IMP and protocol class — the original call and the injection run
   without the lock so contention on this hot path stays minimal.
   */
  private static func invokeOriginal(_ kind: Kind) -> URLSessionConfiguration? {
    let captured: (imp: IMP?, protocolClass: AnyClass?) = state.withLock { state in
      switch kind {
      case .default:
        return (state.originalDefault, state.protocolClass)
      case .ephemeral:
        return (state.originalEphemeral, state.protocolClass)
      }
    }
    guard let imp = captured.imp else {
      return nil
    }
    let fn = unsafeBitCast(imp, to: FactoryFn.self)
    let config = fn(URLSessionConfiguration.self, kind.selector)
    return inject(into: config, protocolClass: captured.protocolClass)
  }

  /**
   Prepends `protocolClass` to the configuration's `protocolClasses` array if it isn't already
   there. Prepending (rather than appending) matters: `URLSession` consults protocol classes in
   order, and our observer needs first dibs so it sees the request before any other registered
   protocol claims it. The duplicate check keeps the array stable across repeat calls.
   */
  private static func inject(into configuration: URLSessionConfiguration?, protocolClass: AnyClass?) -> URLSessionConfiguration? {
    guard let configuration, let protocolClass else {
      return configuration
    }
    var protocols = configuration.protocolClasses ?? []
    if !protocols.contains(where: { $0 == protocolClass }) {
      protocols.insert(protocolClass, at: 0)
      configuration.protocolClasses = protocols
    }
    return configuration
  }
}
