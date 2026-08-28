// Copyright 2015-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

private final class MockSessionDataDelegate: NSObject, URLSessionDataDelegate {
  let tag: String

  init(tag: String) {
    self.tag = tag
    super.init()
  }
}

@Suite("URLSessionSessionDelegateProxy")
struct URLSessionSessionDelegateProxyTests {
  private let session = URLSession(configuration: .default)
  private let request = URLRequest(url: URL(string: "https://expo.dev/")!)
  private let proxy = URLSessionSessionDelegateProxy(
    dispatchQueue: DispatchQueue(label: "expo.test.URLSessionSessionDelegateProxy")
  )

  /// A null Objective-C pointer inside a non-optional task, as a `nonnull`-audited factory can return.
  private func nullTask() -> URLSessionDataTask {
    let nullPointer: UnsafeRawPointer? = nil
    return unsafeBitCast(nullPointer, to: URLSessionDataTask.self)
  }

  @Test("resolves each task to its own delegate")
  func resolvesDelegatePerTask() async throws {
    let first = session.dataTask(with: request)
    let second = session.dataTask(with: request)
    let firstDelegate = MockSessionDataDelegate(tag: "first")
    let secondDelegate = MockSessionDataDelegate(tag: "second")

    proxy.addDelegate(task: first, delegate: firstDelegate)
    proxy.addDelegate(task: second, delegate: secondDelegate)

    #expect((proxy.getDelegate(task: first) as? MockSessionDataDelegate)?.tag == "first")
    #expect((proxy.getDelegate(task: second) as? MockSessionDataDelegate)?.tag == "second")

    proxy.removeDelegate(task: first)

    #expect(proxy.getDelegate(task: first) == nil)
    #expect((proxy.getDelegate(task: second) as? MockSessionDataDelegate)?.tag == "second")

    proxy.removeDelegate(task: second)
  }

  @Test("returns nil for a task that was never registered")
  func returnsNilForUnknownTask() async throws {
    #expect(proxy.getDelegate(task: session.dataTask(with: request)) == nil)
  }

  @Test("ignores a task whose Objective-C pointer is null instead of aborting")
  func ignoresNullTask() async throws {
    let task = nullTask()

    proxy.addDelegate(task: task, delegate: MockSessionDataDelegate(tag: "null"))
    #expect(proxy.getDelegate(task: task) == nil)

    proxy.removeDelegate(task: task)
    #expect(proxy.getDelegate(task: task) == nil)

    let real = session.dataTask(with: request)
    proxy.addDelegate(task: real, delegate: MockSessionDataDelegate(tag: "real"))
    #expect((proxy.getDelegate(task: real) as? MockSessionDataDelegate)?.tag == "real")
    proxy.removeDelegate(task: real)
  }
}
