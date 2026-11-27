// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import ExpoModulesTestCore
import Testing

@_spi(Internal) @testable import ExpoModulesCore

/// Benchmarks for `NewComponentDescriptor::cloneProps`, the props update of an Expo Modules v2 view on
/// the JavaScript thread: React Native's raw props, the base view props and the Swift props decoder.
/// Each operation clones the props of the previous operation with the same JavaScript props object.
extension Benchmarks {
  @Test
  func `component descriptor: update with 1 prop`() async throws {
    try await componentDescriptorBenchmarkCase("{ progress: 0.5 }", name: "component descriptor: update with 1 prop")
  }

  @Test
  func `component descriptor: update with 7 props`() async throws {
    try await componentDescriptorBenchmarkCase(
      "{ title: 'Title', color: '#ff0000', progress: 0.5, count: 3, enabled: true, radius: 8, subtitle: 'Subtitle' }",
      name: "component descriptor: update with 7 props"
    )
  }

  @Test
  func `component descriptor: update with 1 style prop`() async throws {
    try await componentDescriptorBenchmarkCase(
      "{ opacity: 0.5 }",
      name: "component descriptor: update with 1 style prop"
    )
  }

  @Test
  func `component descriptor: update with 1 prop and 5 style props`() async throws {
    try await componentDescriptorBenchmarkCase(
      "{ progress: 0.5, opacity: 0.5, width: 100, height: 50, backgroundColor: 0xff0000ff, borderRadius: 4 }",
      name: "component descriptor: update with 1 prop and 5 style props"
    )
  }

  @Test
  func `component descriptor: dynamic update with 1 prop`() async throws {
    try await dynamicComponentDescriptorBenchmarkCase(
      ["progress": 0.5],
      name: "component descriptor: dynamic update with 1 prop"
    )
  }

  @Test
  func `component descriptor: dynamic update with 1 string prop`() async throws {
    try await dynamicComponentDescriptorBenchmarkCase(
      ["title": "Title"],
      name: "component descriptor: dynamic update with 1 string prop"
    )
  }

  @Test
  func `component descriptor: dynamic update with 1 style prop`() async throws {
    try await dynamicComponentDescriptorBenchmarkCase(
      ["opacity": 0.5],
      name: "component descriptor: dynamic update with 1 style prop"
    )
  }

  @Test
  func `component descriptor: dynamic update with 1 prop and 5 style props`() async throws {
    try await dynamicComponentDescriptorBenchmarkCase(
      ["progress": 0.5, "opacity": 0.5, "width": 100, "height": 50, "backgroundColor": 0xff0000ff, "borderRadius": 4],
      name: "component descriptor: dynamic update with 1 prop and 5 style props"
    )
  }

  @Test
  func `component descriptor: dynamic update with 1 prop in a locked runtime`() async throws {
    try await dynamicComponentDescriptorBenchmarkCase(
      ["progress": 0.5],
      name: "component descriptor: dynamic update with 1 prop in a locked runtime",
      locked: true
    )
  }
}

/// Props as `folly::dynamic`, as Reanimated sends them. They decode in the runtime of the current thread. A locked
/// runtime stands for the worklets UI runtime, which the main thread decodes in.
private func dynamicComponentDescriptorBenchmarkCase(
  _ props: [String: any Sendable],
  name: String,
  locked: Bool = false
) async throws {
  try await benchmarkCase {
    let runtime = locked ? LockingBenchmarkRuntime() : JavaScriptRuntime()
    ViewPropsRuntimes.registerForCurrentThread(runtime)
    withExtendedLifetime(runtime) {
      let descriptor = EXTestNewComponentDescriptor(
        decoder: ViewPropsDecoderAdapter(ViewPropsDecoder<DescriptorBenchmarkProps>(viewName: "BenchmarkView"))
      )
      descriptor.prepare(dynamicProps: props)
      benchmark(name, runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = descriptor.updateWithPreparedDynamicProps()
        }
      }
    }
  }
}

private func componentDescriptorBenchmarkCase(_ source: String, name: String) async throws {
  try await benchmarkCase {
    let runtime = JavaScriptRuntime()
    try withExtendedLifetime(runtime) {
      let descriptor = EXTestNewComponentDescriptor(
        decoder: ViewPropsDecoderAdapter(ViewPropsDecoder<DescriptorBenchmarkProps>(viewName: "BenchmarkView"))
      )
      let props = try runtime.eval("(\(source))")
      runtime.withUnsafePointee { runtimePointer in
        props.withUnsafePointee { propsPointer in
          benchmark(name, runtime: runtime) { iterations in
            for _ in 0..<iterations {
              _ = descriptor.update(runtime: runtimePointer, props: propsPointer)
            }
          }
        }
      }
    }
  }
}

/// A runtime with a recursive `pthread` mutex, which `std::recursive_mutex` of the worklets UI runtime uses on Apple
/// platforms. It doesn't lock each JSI call, as the worklets runtime does.
private final class LockingBenchmarkRuntime: JavaScriptRuntime, JavaScriptRuntimeLocking, @unchecked Sendable {
  private let mutex: UnsafeMutablePointer<pthread_mutex_t> = {
    let mutex = UnsafeMutablePointer<pthread_mutex_t>.allocate(capacity: 1)
    var attributes = pthread_mutexattr_t()
    pthread_mutexattr_init(&attributes)
    pthread_mutexattr_settype(&attributes, PTHREAD_MUTEX_RECURSIVE)
    pthread_mutex_init(mutex, &attributes)
    pthread_mutexattr_destroy(&attributes)
    return mutex
  }()

  deinit {
    pthread_mutex_destroy(mutex)
    mutex.deallocate()
  }

  func withLock(_ body: () -> Void) -> Bool {
    pthread_mutex_lock(mutex)
    defer { pthread_mutex_unlock(mutex) }
    body()
    return true
  }
}

@ViewProps
private struct DescriptorBenchmarkProps {
  var title = ""
  var subtitle = ""
  var color = ""
  var progress = 0.0
  var radius = 0.0
  var count = 0
  var enabled = false
}
