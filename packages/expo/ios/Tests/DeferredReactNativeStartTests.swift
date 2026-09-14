// Copyright 2025-present 650 Industries. All rights reserved.

import Testing
import UIKit
@testable import Expo

#if os(iOS) || os(tvOS)

@Suite(.serialized)
struct DeferredReactNativeStartTests {
  @Test
  @MainActor
  func `defers a start requested before a scene connects`() {
    // The template `AppDelegate` calls `factory.startReactNative(...)` from
    // `application(_:didFinishLaunchingWithOptions:)`, which runs before UIKit connects a scene.
    // Starting there would build a root view controller into a window that never becomes visible.
    let deferred = DeferredReactNativeStart()
    let resolved = deferred.resolve(
      ReactNativeStartRequest(moduleName: "main", initialProperties: nil, launchOptions: nil),
      window: .awaitingScene,
      sceneDelegateWillStart: true
    )
    #expect(resolved == nil)
  }

  @Test
  @MainActor
  func `starts immediately when no scene delegate will replay the start`() {
    // Apps on the plain app-delegate life cycle — the shape `install-expo-modules` generates —
    // have no scene delegate, so a deferred start would never be replayed and the app would show
    // a blank screen.
    let deferred = DeferredReactNativeStart()
    let resolved = deferred.resolve(
      ReactNativeStartRequest(
        moduleName: "customModule",
        initialProperties: ["from": "app delegate"],
        launchOptions: ["key": "value"]
      ),
      window: .awaitingScene,
      sceneDelegateWillStart: false
    )
    #expect(resolved?.moduleName == "customModule")
    #expect(resolved?.initialProperties?["from"] as? String == "app delegate")
    #expect(resolved?.launchOptions?["key"] as? String == "value")
  }

  @Test
  @MainActor
  func `starts immediately when the caller passes no window`() {
    // Brownfield hosts start React Native without a window purely for the factory's side effects,
    // such as registering the delegates expo-dev-menu needs. Nothing replays that start.
    let deferred = DeferredReactNativeStart()
    let resolved = deferred.resolve(
      ReactNativeStartRequest(moduleName: "main", initialProperties: nil, launchOptions: nil),
      window: .absent,
      sceneDelegateWillStart: true
    )
    #expect(resolved != nil)
    #expect(resolved?.moduleName == "main")
  }

  @Test
  @MainActor
  func `starts immediately when the window already belongs to a scene`() {
    let deferred = DeferredReactNativeStart()
    let resolved = deferred.resolve(
      ReactNativeStartRequest(
        moduleName: "main",
        initialProperties: ["from": "scene"],
        launchOptions: ["key": "value"]
      ),
      window: .connectedToApplicationScene,
      sceneDelegateWillStart: true
    )
    #expect(resolved?.moduleName == "main")
    #expect(resolved?.initialProperties?["from"] as? String == "scene")
    #expect(resolved?.launchOptions?["key"] as? String == "value")
  }

  @Test
  @MainActor
  func `replays the deferred module name and initial properties when a scene connects`() {
    // The app delegate is where the app names its module and its initial props, so its request
    // wins over the defaults the scene delegate passes.
    let deferred = DeferredReactNativeStart()
    _ = deferred.resolve(
      ReactNativeStartRequest(
        moduleName: "customModule",
        initialProperties: ["from": "app delegate"],
        launchOptions: nil
      ),
      window: .awaitingScene,
      sceneDelegateWillStart: true
    )
    let resolved = deferred.resolve(
      ReactNativeStartRequest(moduleName: "main", initialProperties: nil, launchOptions: nil),
      window: .connectedToApplicationScene,
      sceneDelegateWillStart: true
    )
    #expect(resolved?.moduleName == "customModule")
    #expect(resolved?.initialProperties?["from"] as? String == "app delegate")
  }

  @Test
  @MainActor
  func `replays the module name and initial properties onto a reconnecting scene`() {
    // `didFinishLaunchingWithOptions` runs once per process, but a scene can connect again after
    // it disconnects. Falling back to the scene's own defaults there would start the module named
    // "main" instead of the one the app registered.
    let deferred = DeferredReactNativeStart()
    _ = deferred.resolve(
      ReactNativeStartRequest(
        moduleName: "customModule",
        initialProperties: ["from": "app delegate"],
        launchOptions: nil
      ),
      window: .awaitingScene,
      sceneDelegateWillStart: true
    )
    _ = deferred.resolve(
      ReactNativeStartRequest(moduleName: "main", initialProperties: nil, launchOptions: nil),
      window: .connectedToApplicationScene,
      sceneDelegateWillStart: true
    )
    let resolved = deferred.resolve(
      ReactNativeStartRequest(moduleName: "main", initialProperties: nil, launchOptions: nil),
      window: .connectedToApplicationScene,
      sceneDelegateWillStart: true
    )
    #expect(resolved?.moduleName == "customModule")
    #expect(resolved?.initialProperties?["from"] as? String == "app delegate")
  }

  @Test
  @MainActor
  func `does not replay the deferred launch options onto a reconnecting scene`() {
    // Launch options carry the URL that cold-started the app. Replaying them on a reconnect would
    // hand `Linking.getInitialURL()` a link the user opened long ago.
    let deferred = DeferredReactNativeStart()
    _ = deferred.resolve(
      ReactNativeStartRequest(
        moduleName: "main",
        initialProperties: nil,
        launchOptions: ["onlyAppDelegate": true]
      ),
      window: .awaitingScene,
      sceneDelegateWillStart: true
    )
    _ = deferred.resolve(
      ReactNativeStartRequest(moduleName: "main", initialProperties: nil, launchOptions: nil),
      window: .connectedToApplicationScene,
      sceneDelegateWillStart: true
    )
    let resolved = deferred.resolve(
      ReactNativeStartRequest(
        moduleName: "main",
        initialProperties: nil,
        launchOptions: ["fromSecondScene": true]
      ),
      window: .connectedToApplicationScene,
      sceneDelegateWillStart: true
    )
    #expect(resolved?.launchOptions?["onlyAppDelegate"] == nil)
    #expect(resolved?.launchOptions?["fromSecondScene"] as? Bool == true)
  }

  @Test
  @MainActor
  func `merges the scene launch options over the deferred ones`() {
    // The scene's launch options carry the cold-start URL that `Linking.getInitialURL()` reads;
    // the app delegate's carry whatever UIKit still passes to `didFinishLaunchingWithOptions`.
    let url = URL(string: "bareexpo://test-suite/run")!
    let deferred = DeferredReactNativeStart()
    _ = deferred.resolve(
      ReactNativeStartRequest(
        moduleName: "main",
        initialProperties: nil,
        launchOptions: ["shared": "app delegate", "onlyAppDelegate": true]
      ),
      window: .awaitingScene,
      sceneDelegateWillStart: true
    )
    let resolved = deferred.resolve(
      ReactNativeStartRequest(
        moduleName: "main",
        initialProperties: nil,
        launchOptions: ["shared": "scene", "url": url]
      ),
      window: .connectedToApplicationScene,
      sceneDelegateWillStart: true
    )
    #expect(resolved?.launchOptions?["onlyAppDelegate"] as? Bool == true)
    #expect(resolved?.launchOptions?["shared"] as? String == "scene")
    #expect(resolved?.launchOptions?["url"] as? URL == url)
  }

  @Test
  @MainActor
  func `keeps the scene launch options when nothing was deferred`() {
    let deferred = DeferredReactNativeStart()
    let resolved = deferred.resolve(
      ReactNativeStartRequest(
        moduleName: "main",
        initialProperties: nil,
        launchOptions: ["fromScene": true]
      ),
      window: .connectedToApplicationScene,
      sceneDelegateWillStart: true
    )
    #expect(resolved?.launchOptions?["fromScene"] as? Bool == true)
  }

  @Test
  @MainActor
  func `keeps the first deferred module name and initial properties`() {
    // A start into a scene-less window can also arrive after a scene has connected — from a
    // brownfield host, say. Recording it would hand the next scene the wrong module.
    let deferred = DeferredReactNativeStart()
    _ = deferred.resolve(
      ReactNativeStartRequest(
        moduleName: "firstModule",
        initialProperties: ["from": "first"],
        launchOptions: nil
      ),
      window: .awaitingScene,
      sceneDelegateWillStart: true
    )
    _ = deferred.resolve(
      ReactNativeStartRequest(
        moduleName: "secondModule",
        initialProperties: ["from": "second"],
        launchOptions: nil
      ),
      window: .awaitingScene,
      sceneDelegateWillStart: true
    )
    let resolved = deferred.resolve(
      ReactNativeStartRequest(moduleName: "main", initialProperties: nil, launchOptions: nil),
      window: .connectedToApplicationScene,
      sceneDelegateWillStart: true
    )
    #expect(resolved?.moduleName == "firstModule")
    #expect(resolved?.initialProperties?["from"] as? String == "first")
  }

  @Test
  @MainActor
  func `replays the initial properties the connecting scene carries over the deferred ones`() {
    // `ExpoAppSceneDelegate` passes none of its own, so this only happens when something else
    // starts into a scene-backed window — a second iPad window, say — and asks for its own props.
    let deferred = DeferredReactNativeStart()
    _ = deferred.resolve(
      ReactNativeStartRequest(
        moduleName: "customModule",
        initialProperties: ["from": "app delegate"],
        launchOptions: nil
      ),
      window: .awaitingScene,
      sceneDelegateWillStart: true
    )
    let resolved = deferred.resolve(
      ReactNativeStartRequest(
        moduleName: "main",
        initialProperties: ["from": "second window"],
        launchOptions: nil
      ),
      window: .connectedToApplicationScene,
      sceneDelegateWillStart: true
    )
    #expect(resolved?.initialProperties?["from"] as? String == "second window")
    // The module name keeps its own precedence: only the properties follow the caller.
    #expect(resolved?.moduleName == "customModule")
  }

  @Test
  @MainActor
  func `keeps the deferred start for the application scene when another scene connects first`() {
    // A CarPlay or external display scene can connect before the application scene does. Replaying
    // the deferred start there would show the app's module on the car screen and eat the
    // cold-start URL, leaving `Linking.getInitialURL()` empty on the scene that shows the app.
    let deferred = DeferredReactNativeStart()
    _ = deferred.resolve(
      ReactNativeStartRequest(
        moduleName: "customModule",
        initialProperties: ["from": "app delegate"],
        launchOptions: ["url": "bareexpo://cold-start"]
      ),
      window: .awaitingScene,
      sceneDelegateWillStart: true
    )

    let otherScene = deferred.resolve(
      ReactNativeStartRequest(
        moduleName: "carPlayModule",
        initialProperties: ["from": "car play"],
        launchOptions: ["fromCarPlay": true]
      ),
      window: .connectedToOtherScene,
      sceneDelegateWillStart: true
    )
    #expect(otherScene?.moduleName == "carPlayModule")
    #expect(otherScene?.initialProperties?["from"] as? String == "car play")
    #expect(otherScene?.launchOptions?["fromCarPlay"] as? Bool == true)
    #expect(otherScene?.launchOptions?["url"] == nil)

    let applicationScene = deferred.resolve(
      ReactNativeStartRequest(moduleName: "main", initialProperties: nil, launchOptions: nil),
      window: .connectedToApplicationScene,
      sceneDelegateWillStart: true
    )
    #expect(applicationScene?.moduleName == "customModule")
    #expect(applicationScene?.initialProperties?["from"] as? String == "app delegate")
    #expect(applicationScene?.launchOptions?["url"] as? String == "bareexpo://cold-start")
  }

  // MARK: - Module name precedence

  @Test
  @MainActor
  func `replays the default module name when neither side names one`() {
    let moduleName = replayedModuleName(
      rememberedFromAppDelegate: defaultReactNativeFactoryModuleName,
      namedByScene: defaultReactNativeFactoryModuleName
    )
    #expect(moduleName == defaultReactNativeFactoryModuleName)
  }

  @Test
  @MainActor
  func `replays the module name the app delegate names over the scene default`() {
    let moduleName = replayedModuleName(
      rememberedFromAppDelegate: "appDelegateModule",
      namedByScene: defaultReactNativeFactoryModuleName
    )
    #expect(moduleName == "appDelegateModule")
  }

  @Test
  @MainActor
  func `replays the module name the scene names when the app delegate keeps the default`() {
    // The scene delegate's only knob is `reactNativeFactoryModuleName`, and the template app
    // delegate passes the default, so preferring what it remembered would ignore the scene's name.
    let moduleName = replayedModuleName(
      rememberedFromAppDelegate: defaultReactNativeFactoryModuleName,
      namedByScene: "providerModule"
    )
    #expect(moduleName == "providerModule")
  }

  @Test
  @MainActor
  func `replays the module name the app delegate names over the one the scene names`() {
    // The app delegate's line is what config plugins and hand edits patch, so a name set there
    // outranks the provider's.
    let moduleName = replayedModuleName(
      rememberedFromAppDelegate: "appDelegateModule",
      namedByScene: "providerModule"
    )
    #expect(moduleName == "appDelegateModule")
  }

  // MARK: - Window classification

  @Test
  func `classifies a missing window as absent`() {
    #expect(ReactNativeStartWindow(hasWindow: false, sceneSessionRole: nil) == .absent)
  }

  @Test
  func `classifies a window with no scene as awaiting one`() {
    #expect(ReactNativeStartWindow(hasWindow: true, sceneSessionRole: nil) == .awaitingScene)
  }

  @Test
  func `classifies a window on the application scene as connected to it`() {
    // This is the only role `ExpoAppSceneDelegate` replays a deferred start onto.
    let window = ReactNativeStartWindow(hasWindow: true, sceneSessionRole: .windowApplication)
    #expect(window == .connectedToApplicationScene)
  }

  @Test
  func `classifies a window on an external display scene as connected to another scene`() {
    // An external display scene can show a root view, and no scene delegate replays a start into
    // it, so calling it "awaiting" would leave that display blank for the life of the process.
    let window = ReactNativeStartWindow(
      hasWindow: true,
      sceneSessionRole: .windowExternalDisplayNonInteractive
    )
    #expect(window == .connectedToOtherScene)
  }

  @Test
  func `classifies a window on any other scene role as connected to another scene`() {
    // UIKit keeps adding roles — the two CarPlay ones below already ship — and a window on a role
    // this code has never heard of is still a window a scene can show. Naming the roles that may
    // start would blank out every role added after this file was written.
    let roles = [
      "CPTemplateApplicationDashboardSceneSessionRoleApplication",
      "CPTemplateApplicationInstrumentClusterSceneSessionRoleApplication",
      "UIWindowSceneSessionRoleFromAnSDKThatDoesNotExistYet",
    ]
    for role in roles {
      let window = ReactNativeStartWindow(
        hasWindow: true,
        sceneSessionRole: UISceneSession.Role(rawValue: role)
      )
      #expect(window == .connectedToOtherScene, "\(role)")
    }
  }

  @Test
  func `recognizes a scene manifest naming an Expo scene delegate subclass`() {
    // Apps name their own subclass, and the built Info.plist qualifies it with the module, as in
    // `BareExpo.SceneDelegate`.
    let manifest = sceneManifest(delegateClassName: NSStringFromClass(TestSceneDelegate.self))
    #expect(ExpoSceneDelegateManifest.declaresExpoSceneDelegate(sceneManifest: manifest))
  }

  @Test
  func `recognizes a scene manifest naming an Expo scene delegate by its module-qualified name`() {
    // This is the string the build writes: the template Info.plist holds
    // `$(PRODUCT_MODULE_NAME).SceneDelegate`, which is not the Objective-C runtime name of a class
    // renamed by `@objc(...)`, as the template's `SceneDelegate` is.
    let className = String(reflecting: TestSceneDelegate.self)
    #expect(className.hasSuffix(".TestSceneDelegate"))
    #expect(className != NSStringFromClass(TestSceneDelegate.self))
    let manifest = sceneManifest(delegateClassName: className)
    #expect(ExpoSceneDelegateManifest.declaresExpoSceneDelegate(sceneManifest: manifest))
  }

  @Test
  func `ignores a scene manifest naming a foreign scene delegate`() {
    // Another scene delegate won't replay a deferred start, so deferring to it would never start.
    let manifest = sceneManifest(delegateClassName: NSStringFromClass(NSObject.self))
    #expect(!ExpoSceneDelegateManifest.declaresExpoSceneDelegate(sceneManifest: manifest))
  }

  @Test
  func `ignores a scene manifest whose application role also names a foreign scene delegate`() {
    // UIKit picks one of these configurations, and without
    // `application(_:configurationForConnecting:options:)` we can't know which. If it picks the
    // foreign one, nothing replays the deferred start and the app stays blank.
    let manifest = sceneManifest(delegateClassNames: [
      NSStringFromClass(TestSceneDelegate.self),
      NSStringFromClass(NSObject.self),
    ])
    #expect(!ExpoSceneDelegateManifest.declaresExpoSceneDelegate(sceneManifest: manifest))
  }

  @Test
  func `ignores a scene manifest with no application scene configuration`() {
    let manifest = sceneManifest(delegateClassNames: [])
    #expect(!ExpoSceneDelegateManifest.declaresExpoSceneDelegate(sceneManifest: manifest))
  }

  @Test
  func `ignores a missing scene manifest`() {
    #expect(!ExpoSceneDelegateManifest.declaresExpoSceneDelegate(sceneManifest: nil))
  }

  @Test
  @MainActor
  func `the factory starts React Native when the bundle declares no Expo scene delegate`() {
    // This test bundle has no scene manifest, like an app on the plain app-delegate life cycle, so
    // nothing would ever replay a deferred start. Deferring here is the blank screen this deferral
    // must not cause; a started window has a root view controller.
    let delegate = BundleURLProvidingDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 320, height: 480))
    factory.startReactNative(withModuleName: "main", in: window, launchOptions: nil)
    #expect(window.rootViewController != nil)
  }

  @Test
  @MainActor
  func `the factory starts React Native when the caller passes no window`() {
    // Brownfield hosts rely on the side effects of a windowless start, so it must reach `super`
    // even in a test bundle, which declares no Expo scene delegate.
    let delegate = BundleURLProvidingDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    factory.startReactNative(withModuleName: "main", in: nil, launchOptions: nil)
    // `super` builds the root view with `bundleConfiguration`, which asks the delegate for the URL.
    #expect(delegate.bundleURLCallCount > 0)
  }

  private func sceneManifest(delegateClassName: String) -> [String: Any] {
    return sceneManifest(delegateClassNames: [delegateClassName])
  }

  private func sceneManifest(delegateClassNames: [String]) -> [String: Any] {
    return [
      "UISceneConfigurations": [
        "UIWindowSceneSessionRoleApplication": delegateClassNames.map {
          ["UISceneDelegateClassName": $0]
        }
      ]
    ]
  }

  @MainActor
  private func replayedModuleName(
    rememberedFromAppDelegate: String,
    namedByScene: String
  ) -> String? {
    let deferred = DeferredReactNativeStart()
    _ = deferred.resolve(
      ReactNativeStartRequest(
        moduleName: rememberedFromAppDelegate,
        initialProperties: nil,
        launchOptions: nil
      ),
      window: .awaitingScene,
      sceneDelegateWillStart: true
    )
    return deferred.resolve(
      ReactNativeStartRequest(moduleName: namedByScene, initialProperties: nil, launchOptions: nil),
      window: .connectedToApplicationScene,
      sceneDelegateWillStart: true
    )?.moduleName
  }
}

/// React Native's default `bundleURL` raises an exception, which would abort the whole test
/// process instead of failing this test. A remote URL also keeps the bundle load asynchronous,
/// so starting React Native here cannot trap on reading a bundle off disk.
private final class BundleURLProvidingDelegate: ExpoReactNativeFactoryDelegate {
  private(set) var bundleURLCallCount = 0

  override func bundleURL() -> URL? {
    bundleURLCallCount += 1
    return URL(string: "http://localhost:8081/index.bundle")
  }
}

/// Mirrors the shape of the template's `SceneDelegate`: renamed in the Objective-C runtime by
/// `@objc(...)`, and not `private`, whose runtime name is mangled and could not carry that rename.
@objc(EXTestSceneDelegate)
final class TestSceneDelegate: ExpoAppSceneDelegate {}

#endif
