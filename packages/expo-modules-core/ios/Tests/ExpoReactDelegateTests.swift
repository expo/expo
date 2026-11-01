// Copyright 2026-present 650 Industries. All rights reserved.

#if os(iOS) || os(tvOS)

import Testing
import UIKit

@testable import ExpoModulesCore

private final class StubReactNativeFactory: ExpoReactNativeFactoryProtocol {
  private(set) var recreateRootViewCallCount = 0

  func recreateRootView(
    withBundleURL: URL?,
    moduleName: String?,
    initialProps: [AnyHashable: Any]?,
    launchOptions: [AnyHashable: Any]?
  ) -> UIView {
    recreateRootViewCallCount += 1
    return UIView()
  }
}

private final class FakeReactRootViewHandler: ExpoReactDelegateHandler {
  var rootView: UIView?
  private(set) var createReactRootViewCallCount = 0

  convenience init(rootView: UIView?) {
    self.init()
    self.rootView = rootView
  }

  override func createReactRootView(
    reactDelegate: ExpoReactDelegate,
    moduleName: String,
    initialProperties: [AnyHashable: Any]?,
    launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> UIView? {
    createReactRootViewCallCount += 1
    return rootView
  }
}

@Suite("ExpoReactDelegate")
@MainActor
struct ExpoReactDelegateTests {
  @Test
  func `createReactRootView stops at the first handler that returns a view`() {
    let firstView = UIView()
    let first = FakeReactRootViewHandler(rootView: firstView)
    let second = FakeReactRootViewHandler(rootView: UIView())
    let factory = StubReactNativeFactory()
    let delegate = ExpoReactDelegate(handlers: [first, second], reactNativeFactory: factory)

    let result = delegate.createReactRootView(moduleName: "main", initialProperties: nil, launchOptions: nil)

    #expect(result === firstView)
    #expect(first.createReactRootViewCallCount == 1)
    #expect(second.createReactRootViewCallCount == 0)
    #expect(factory.recreateRootViewCallCount == 0)
  }

  @Test
  func `createReactRootView skips handlers that return nil and stops at the next view`() {
    let secondView = UIView()
    let first = FakeReactRootViewHandler(rootView: nil)
    let second = FakeReactRootViewHandler(rootView: secondView)
    let third = FakeReactRootViewHandler(rootView: UIView())
    let factory = StubReactNativeFactory()
    let delegate = ExpoReactDelegate(handlers: [first, second, third], reactNativeFactory: factory)

    let result = delegate.createReactRootView(moduleName: "main", initialProperties: nil, launchOptions: nil)

    #expect(result === secondView)
    #expect(first.createReactRootViewCallCount == 1)
    #expect(second.createReactRootViewCallCount == 1)
    #expect(third.createReactRootViewCallCount == 0)
    #expect(factory.recreateRootViewCallCount == 0)
  }
}

#endif
