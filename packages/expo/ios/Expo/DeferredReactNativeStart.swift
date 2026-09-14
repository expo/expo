// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

#if os(iOS) || os(tvOS)
import UIKit

/// The arguments of one `startReactNative(withModuleName:in:initialProperties:launchOptions:)` call.
///
/// Unchecked because launch options and initial properties are untyped UIKit payloads. The request
/// only carries them from the nonisolated factory override to the main actor and back, on the one
/// thread that ever starts React Native.
struct ReactNativeStartRequest: @unchecked Sendable {
  let moduleName: String
  let initialProperties: [AnyHashable: Any]?
  let launchOptions: [AnyHashable: Any]?
}

/// What the window a caller passed to `startReactNative(...)` says about where the root view can go.
enum ReactNativeStartWindow {
  /// The window belongs to the scene that shows the app's main UI, the one `ExpoAppSceneDelegate`
  /// replays a deferred start onto.
  case connectedToApplicationScene
  /// The window belongs to some other connected scene — an external display, a CarPlay screen, or
  /// a role a later UIKit adds. It can show a root view, but nothing replays a start into it.
  case connectedToOtherScene
  /// A window with no scene yet, as `didFinishLaunchingWithOptions` creates.
  case awaitingScene
  /// No window at all — a brownfield host passes this when it only wants the factory's side effects.
  case absent

  init(hasWindow: Bool, sceneSessionRole: UISceneSession.Role?) {
    guard hasWindow else {
      self = .absent
      return
    }
    // A window UIKit has not connected to a scene has no session at all, so the absent role is the
    // whole test. Every role that does exist names a scene that can show a root view, and only the
    // application scene gets a replay, so the rest must start now: listing the roles that may start
    // would leave a window blank for good on every role a later UIKit adds.
    guard let sceneSessionRole else {
      self = .awaitingScene
      return
    }
    self = sceneSessionRole == .windowApplication ? .connectedToApplicationScene : .connectedToOtherScene
  }
}

/**
 Reads the app's `UIApplicationSceneManifest` to answer whether an `ExpoAppSceneDelegate` is
 registered for the application scene role, and will therefore start React Native itself.

 The manifest is the only declaration this can read, and an app that builds its scene configuration
 at runtime — `application(_:configurationForConnecting:options:)` returning one the manifest does
 not describe — can contradict it either way. Naming no delegate reads as `false` and starts React
 Native twice, once from the app delegate and once from the scene. Naming an Expo one that a runtime
 configuration then replaces reads as `true` and defers the app delegate's start; the foreign
 delegate replays it only if it starts React Native through this factory with its own scene-backed
 window, and a delegate that builds its own root view instead — or none at all — renders the same
 either way. No prebuild-generated app has either shape.

 A double start costs one extra root view on the same React host, not a second JavaScript runtime,
 and the orphaned window is released as soon as the scene delegate overwrites `provider.window`. It
 is not free, though: `RCTRootViewFactory.createReactHostIfNeeded` returns early once a host exists,
 so only the launch options of the start that creates the host ever reach it.
 */
enum ExpoSceneDelegateManifest {
  static func declaresExpoSceneDelegate(in bundle: Bundle = .main) -> Bool {
    return declaresExpoSceneDelegate(
      sceneManifest: bundle.object(forInfoDictionaryKey: "UIApplicationSceneManifest") as? [String: Any]
    )
  }

  static func declaresExpoSceneDelegate(sceneManifest: [String: Any]?) -> Bool {
    let applicationRole = UISceneSession.Role.windowApplication.rawValue
    guard let configurations = sceneManifest?["UISceneConfigurations"] as? [String: Any],
      let applicationConfigurations = configurations[applicationRole] as? [[String: Any]] else {
      return false
    }
    // UIKit picks one of these configurations, and without
    // `application(_:configurationForConnecting:options:)` there is no telling which, so a start may
    // only be deferred when every candidate would replay it. `allSatisfy` is vacuously true for an
    // empty array, hence the emptiness check.
    return !applicationConfigurations.isEmpty && applicationConfigurations.allSatisfy { configuration in
      // The built Info.plist qualifies the class with its module, as in `BareExpo.SceneDelegate`,
      // which `NSClassFromString` resolves.
      guard let className = configuration["UISceneDelegateClassName"] as? String,
        let sceneDelegateClass = NSClassFromString(className) else {
        return false
      }
      return sceneDelegateClass is ExpoAppSceneDelegate.Type
    }
  }
}

/**
 Holds back a React Native start that an `AppDelegate` requests from
 `application(_:didFinishLaunchingWithOptions:)`, before UIKit has connected a `UIWindowScene`.

 Such a window can never become visible under the scene-based life cycle, so starting into it
 builds a root view controller that is immediately dropped. Holding the request until the scene
 delegate supplies a real window keeps the `factory.startReactNative(...)` line in the template
 `AppDelegate` — which published config plugins use as a codemod anchor — while the scene delegate
 stays the code path that actually starts React Native.
 */
@MainActor
final class DeferredReactNativeStart {
  private var appDelegateComponent: (moduleName: String, initialProperties: [AnyHashable: Any]?)?
  private var appDelegateLaunchOptions: [AnyHashable: Any]?

  nonisolated init() {}

  /// Returns the request to start with now, or `nil` while the start must wait for the scene
  /// delegate to replay it with a scene-backed window.
  func resolve(
    _ request: ReactNativeStartRequest,
    window: ReactNativeStartWindow,
    sceneDelegateWillStart: Bool
  ) -> ReactNativeStartRequest? {
    switch window {
    case .connectedToApplicationScene:
      return replaying(request)
    case .connectedToOtherScene:
      // Replaying here would show the app delegate's module on a car screen or an external
      // display, and would spend the one-shot launch options on a scene that cannot act on the
      // cold-start URL, leaving `Linking.getInitialURL()` empty on the scene that shows the app.
      return request
    case .absent:
      // A windowless start asks for the factory's side effects — the delegates expo-dev-menu needs
      // — not for a root view, and no scene delegate replays it.
      return request
    case .awaitingScene:
      guard sceneDelegateWillStart else {
        return request
      }
      // A start into a scene-less window can also arrive long after the app delegate's — from a
      // brownfield host, say — and replaying that one would show the wrong module on the next
      // scene, so the first request wins.
      if appDelegateComponent == nil {
        appDelegateComponent = (request.moduleName, request.initialProperties)
        appDelegateLaunchOptions = request.launchOptions
      }
      return nil
    }
  }

  private func replaying(_ request: ReactNativeStartRequest) -> ReactNativeStartRequest {
    // Both sides can name the module: the app delegate's `startReactNative(...)` line, which apps
    // and config plugins patch, and `reactNativeFactoryModuleName`, which the scene delegate passes.
    // Either may still be carrying the untouched default — the template app delegate passes it
    // literally — so an explicit name from one side beats the default from the other, and the app
    // delegate wins when both are explicit.
    let moduleName = [appDelegateComponent?.moduleName, request.moduleName]
      .compactMap { $0 }
      .first { $0 != defaultReactNativeFactoryModuleName }
      ?? defaultReactNativeFactoryModuleName

    // `ExpoAppSceneDelegate` calls the three-argument overload, so the primary flow brings no
    // properties of its own and the deferred ones win. A caller that does bring some — a second
    // iPad window, say — means them for the window it is starting, not for the first one.
    let initialProperties = request.initialProperties ?? appDelegateComponent?.initialProperties

    // Launch options merge, the scene's winning any key both name: they carry the cold-start URL and
    // user activity that UIKit now delivers to the scene instead of to
    // `didFinishLaunchingWithOptions`.
    let launchOptions = merge(appDelegateLaunchOptions, with: request.launchOptions)

    // Launch options describe how this process was launched, so only the scene that connects first
    // may see them; a scene reconnecting later would otherwise reopen a long-since-handled link.
    appDelegateLaunchOptions = nil

    return ReactNativeStartRequest(
      moduleName: moduleName,
      initialProperties: initialProperties,
      launchOptions: launchOptions
    )
  }

  private func merge(
    _ launchOptions: [AnyHashable: Any]?,
    with sceneLaunchOptions: [AnyHashable: Any]?
  ) -> [AnyHashable: Any]? {
    guard let launchOptions else {
      return sceneLaunchOptions
    }
    guard let sceneLaunchOptions else {
      return launchOptions
    }
    return launchOptions.merging(sceneLaunchOptions) { _, fromScene in fromScene }
  }
}

#endif
