// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore

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
