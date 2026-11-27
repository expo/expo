// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Foundation
import Testing

@_spi(Internal) @testable import ExpoModulesCore

@ViewProps
private struct EndToEndProps {
  var title = "Untitled"
  var radius = 4.0
}

@ExpoView<EndToEndProps>
private final class EndToEndView: ExpoNativeView {}

/// Runs props through the whole path that Fabric takes: `NewComponentDescriptor::cloneProps` in C++,
/// `ObjCPropsDecoder`, `ViewPropsDecoderAdapter` and `ViewPropsDecoder` in Swift.
@Suite
@JavaScriptActor
struct ViewPropsEndToEndTests {
  let runtime = JavaScriptRuntime()
  let descriptor = EXTestNewComponentDescriptor(
    decoder: ViewPropsDecoderAdapter(ViewPropsDecoder<EndToEndProps>(viewName: "EndToEndView"))
  )

  private func update(_ source: String) throws -> DecodedViewProps<EndToEndProps>? {
    let props = try runtime.eval("(\(source))")
    let decoded = runtime.withUnsafePointee { runtimePointer in
      props.withUnsafePointee { propsPointer in
        descriptor.update(runtime: runtimePointer, props: propsPointer)
      }
    }
    return decoded as? DecodedViewProps<EndToEndProps>
  }

  @Test
  func `create decodes the view props and parses the base view props`() throws {
    let created = try #require(try update("{ title: 'Card', opacity: 0.5 }"))

    #expect(created.props.title == "Card")
    #expect(created.props.radius == 4)
    #expect(created.changedProps(since: nil) == EndToEndProps.allProps)
    #expect(descriptor.opacity == 0.5)
  }

  @Test
  func `updates add up to the props changed since the mounted ones`() throws {
    let mounted = try update("{ title: 'Card' }")
    _ = try update("{ title: 'New card' }")
    let latest = try #require(try update("{ radius: 8, opacity: 0.5 }"))

    #expect(latest.props.title == "New card")
    #expect(latest.props.radius == 8)
    #expect(latest.changedProps(since: mounted) == [.title, .radius])

    let diff = PropsDiff(old: mounted, new: latest)
    #expect(diff.oldValue(\.title) == "Card")
    #expect(diff.newProps.title == "New card")
    #expect(diff.changedNames == [.title, .radius])
  }

  @Test
  func `removed prop goes back to its default`() throws {
    _ = try update("{ title: 'Card' }")
    let updated = try #require(try update("{ title: null }"))

    #expect(updated.props.title == "Untitled")
  }

  @Test
  func `update with only style props keeps the decoded props`() throws {
    let created = try update("{ title: 'Card' }")
    let updated = try update("{ opacity: 0.5 }")

    #expect(updated === created)
    #expect(descriptor.opacity == 0.5)
  }

  @Test
  func `decoded props are freed when the descriptor drops them`() throws {
    weak var created: DecodedViewProps<EndToEndProps>?
    weak var updated: DecodedViewProps<EndToEndProps>?
    try autoreleasepool {
      created = try update("{ title: 'Card' }")
      // A value that doesn't decode changes no prop, so the decoder passes `NULL` and the previous props stay.
      let unchanged = try update("{ title: 5 }")
      #expect(unchanged === created)
    }
    #expect(created != nil)

    try autoreleasepool {
      updated = try update("{ title: 'New card' }")
    }
    // The descriptor keeps only the latest props.
    #expect(created == nil)
    #expect(updated != nil)

    descriptor.reset()
    #expect(updated == nil)
  }

  @Test
  func `props without a runtime keep the decoded props on a thread without a runtime`() throws {
    let created = try update("{ title: 'Card' }")
    // A new thread, so no runtime is registered for it.
    nonisolated(unsafe) let descriptor = descriptor
    nonisolated(unsafe) var updated: DecodedViewProps<EndToEndProps>?
    let finished = DispatchSemaphore(value: 0)
    Thread {
      updated =
        descriptor.update(dynamicProps: ["title": "New card", "opacity": 0.5]) as? DecodedViewProps<EndToEndProps>
      finished.signal()
    }.start()
    finished.wait()

    #expect(updated === created)
    #expect(updated?.props.title == "Card")
    #expect(descriptor.opacity == 0.5)
  }

  @Test
  func `props without a runtime are decoded in the runtime of the current thread`() throws {
    // Prepares its runtime on this thread, as React Native prepares the main runtime on the JavaScript thread.
    let appContext = AppContext.create()
    _ = try update("{ title: 'Card' }")
    let updated = try #require(
      descriptor.update(dynamicProps: ["title": "New card", "radius": 8, "opacity": 0.5])
        as? DecodedViewProps<EndToEndProps>
    )

    #expect(updated.props.title == "New card")
    #expect(updated.props.radius == 8)
    #expect(descriptor.opacity == 0.5)
    withExtendedLifetime(appContext) {}
  }

  @Test
  func `props without a runtime are decoded in the lock of a runtime that other threads use too`() throws {
    _ = try update("{ title: 'Card' }")
    let lockingRuntime = LockingTestRuntime()
    let updated = try #require(updateOnNewThread(registering: lockingRuntime, dynamicProps: ["title": "New card"]))

    #expect(updated.props.title == "New card")
    #expect(lockingRuntime.lockCount == 1)
  }

  @Test
  func `props without a runtime keep the decoded props when the engine of a locked runtime is gone`() throws {
    let created = try update("{ title: 'Card' }")
    let lockingRuntime = LockingTestRuntime()
    lockingRuntime.isEngineGone = true
    let updated = updateOnNewThread(registering: lockingRuntime, dynamicProps: ["title": "New card"])

    #expect(updated === created)
    #expect(updated?.props.title == "Card")
  }

  /// Registers `runtime` for a new thread and sends the props there as `folly::dynamic`.
  private func updateOnNewThread(
    registering runtime: JavaScriptRuntime,
    dynamicProps: [String: Any]
  ) -> DecodedViewProps<EndToEndProps>? {
    nonisolated(unsafe) let descriptor = descriptor
    nonisolated(unsafe) let runtime = runtime
    nonisolated(unsafe) let dynamicProps = dynamicProps
    nonisolated(unsafe) var updated: DecodedViewProps<EndToEndProps>?
    let finished = DispatchSemaphore(value: 0)
    Thread {
      ViewPropsRuntimes.registerForCurrentThread(runtime)
      updated = descriptor.update(dynamicProps: dynamicProps) as? DecodedViewProps<EndToEndProps>
      finished.signal()
    }.start()
    finished.wait()
    return updated
  }
}

/// A runtime that other threads use too, such as the worklets UI runtime.
private final class LockingTestRuntime: JavaScriptRuntime, JavaScriptRuntimeLocking, @unchecked Sendable {
  /// Whether the engine runtime is gone, as the worklets UI runtime is after a reload.
  var isEngineGone = false
  private(set) var lockCount = 0

  func withLock(_ body: () -> Void) -> Bool {
    if isEngineGone {
      return false
    }
    lockCount += 1
    body()
    return true
  }
}

/// A registered view creates its props decoder at the first decode, on the thread that decodes. Fabric decodes the
/// props from React on the JavaScript thread, so the decoder must be created off the main thread.
@Suite
struct RegisteredViewDecodingTests {
  @Test
  func `registered view decodes its first props on the JavaScript thread`() async throws {
    let componentName = ExpoNativeView.packageComponentName(packageName: "view-props-end-to-end-tests", viewName: "EndToEndView")
    await MainActor.run {
      ExpoNativeView.registerComponent(EndToEndView.self, componentName: componentName)
    }
    let viewClass: AnyClass = try #require(NSClassFromString(componentName))
    let (title, isMainThread) = await decodeTitleOnJavaScriptThread(viewClass: viewClass, source: "({ title: 'Card' })")

    #expect(title == "Card")
    #expect(isMainThread == false)
  }

  /// Decodes the props on a thread with the name of React Native's JavaScript thread, and returns the decoded title.
  private func decodeTitleOnJavaScriptThread(viewClass: AnyClass, source: String) async -> (String?, Bool) {
    return await withCheckedContinuation { continuation in
      let thread = Thread {
        let result = JavaScriptActor.assumeIsolated { () -> (String?, Bool) in
          let runtime = JavaScriptRuntime()
          let descriptor = EXTestNewComponentDescriptor(viewClass: viewClass)
          guard let props = try? runtime.eval(source) else {
            return (nil, Thread.isMainThread)
          }
          let decoded = runtime.withUnsafePointee { runtimePointer in
            props.withUnsafePointee { propsPointer in
              descriptor.update(runtime: runtimePointer, props: propsPointer)
            }
          }
          return ((decoded as? DecodedViewProps<EndToEndProps>)?.props.title, Thread.isMainThread)
        }
        continuation.resume(returning: result)
      }
      // The name of the JavaScript thread in `RCTJSThreadManager.mm`.
      thread.name = "com.facebook.react.runtime.JavaScript"
      thread.start()
    }
  }
}
