// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import React
import Testing
@testable import Expo

#if os(iOS) || os(tvOS)

final class BundleURLHandler: ExpoReactDelegateHandler {
  var url: URL?

  override func bundleURL(reactDelegate: ExpoReactDelegate) -> URL? {
    return url
  }
}

final class StubReactNativeFactory: ExpoReactNativeFactoryProtocol {
  func recreateRootView(
    withBundleURL: URL?,
    moduleName: String?,
    initialProps: [AnyHashable: Any]?,
    launchOptions: [AnyHashable: Any]?
  ) -> UIView {
    fatalError("Not used by these tests")
  }
}

@Suite
@MainActor
struct ExpoReactRootViewFactoryTests {
  let handlerURL = URL(string: "file:///launch-asset.bundle")!
  let delegateURL = URL(string: "http://localhost:8081/index.bundle")!
  let stubFactory = StubReactNativeFactory()

  func makeFactory(handler: BundleURLHandler) -> (ExpoReactRootViewFactory, RCTRootViewFactoryConfiguration, ExpoReactDelegate) {
    let reactDelegate = ExpoReactDelegate(handlers: [handler], reactNativeFactory: stubFactory)
    let delegateURL = self.delegateURL
    let configuration = RCTRootViewFactoryConfiguration(bundleURLBlock: { delegateURL })
    let factory = ExpoReactRootViewFactory(
      reactDelegate: reactDelegate,
      configuration: configuration,
      turboModuleManagerDelegate: nil
    )
    return (factory, configuration, reactDelegate)
  }

  @Test
  func `configuration bundle URL prefers the handler URL`() {
    // RCTHost reads the bundle URL from the configuration block, so handler URLs must be visible there.
    let handler = BundleURLHandler()
    handler.url = handlerURL
    let (factory, configuration, reactDelegate) = makeFactory(handler: handler)

    #expect(configuration.bundleURLBlock() == handlerURL)
    withExtendedLifetime((factory, reactDelegate)) {}
  }

  @Test
  func `replaced fallback is used when no handler provides a URL`() {
    let handler = BundleURLHandler()
    let (factory, configuration, reactDelegate) = makeFactory(handler: handler)
    let sourceURL = URL(string: "http://192.168.1.2:8081/index.bundle")!

    factory.fallbackBundleURLBlock = { sourceURL }
    #expect(configuration.bundleURLBlock() == sourceURL)

    handler.url = handlerURL
    #expect(configuration.bundleURLBlock() == handlerURL)
    withExtendedLifetime((factory, reactDelegate)) {}
  }
}

#endif
