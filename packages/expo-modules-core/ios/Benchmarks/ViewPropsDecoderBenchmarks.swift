// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore

/// Benchmarks for decoding the props of an Expo Modules v2 view with `ViewPropsDecoder`, as
/// `NewComponentDescriptor` does on each props update. Each operation decodes an update into a copy of
/// the previous props and makes new `DecodedViewProps`.
extension Benchmarks {
  @Test
  func `view props decoder: update with 1 prop`() async throws {
    try await viewPropsDecoderBenchmarkCase("{ progress: 0.5 }", of: DecoderBenchmarkProps.self) { decode in
      try benchmark("view props decoder: update with 1 prop", runtime: nil) { iterations in
        for _ in 0..<iterations {
          _ = decode()
        }
      }
    }
  }

  @Test
  func `view props decoder: update with 7 props`() async throws {
    try await viewPropsDecoderBenchmarkCase(
      "{ title: 'Title', color: '#ff0000', progress: 0.5, count: 3, enabled: true, radius: 8, subtitle: 'Subtitle' }",
      of: DecoderBenchmarkProps.self
    ) { decode in
      try benchmark("view props decoder: update with 7 props", runtime: nil) { iterations in
        for _ in 0..<iterations {
          _ = decode()
        }
      }
    }
  }

  @Test
  func `view props decoder: reset 7 props with null`() async throws {
    try await viewPropsDecoderBenchmarkCase(
      "{ title: null, color: null, progress: null, count: null, enabled: null, radius: null, subtitle: null }",
      of: DecoderBenchmarkProps.self
    ) { decode in
      try benchmark("view props decoder: reset 7 props with null", runtime: nil) { iterations in
        for _ in 0..<iterations {
          _ = decode()
        }
      }
    }
  }

  @Test
  func `view props decoder: update with 1 of 20 props and a style prop`() async throws {
    try await viewPropsDecoderBenchmarkCase(
      "{ prop19: 'value', opacity: 0.5 }",
      of: WideBenchmarkProps.self
    ) { decode in
      try benchmark("view props decoder: update with 1 of 20 props and a style prop", runtime: nil) { iterations in
        for _ in 0..<iterations {
          _ = decode()
        }
      }
    }
  }

  @Test
  func `view props decoder: reset 1 of 20 props with expensive defaults`() async throws {
    try await viewPropsDecoderBenchmarkCase("{ tags3: null }", of: ExpensiveDefaultsBenchmarkProps.self) { decode in
      try benchmark("view props decoder: reset 1 of 20 props with expensive defaults", runtime: nil) { iterations in
        for _ in 0..<iterations {
          _ = decode()
        }
      }
    }
  }

  @Test
  func `view props decoder: reset 7 of 20 props with expensive defaults`() async throws {
    try await viewPropsDecoderBenchmarkCase(
      "{ text0: null, tags0: null, weights0: null, labels0: null, insets0: null, text1: null, tags1: null }",
      of: ExpensiveDefaultsBenchmarkProps.self
    ) { decode in
      try benchmark("view props decoder: reset 7 of 20 props with expensive defaults", runtime: nil) { iterations in
        for _ in 0..<iterations {
          _ = decode()
        }
      }
    }
  }
}

private func viewPropsDecoderBenchmarkCase<Props: AnyViewProps>(
  _ source: String,
  of propsType: Props.Type,
  _ body: @escaping @JavaScriptActor (() -> DecodedViewProps<Props>?) throws -> Void
) async throws {
  try await benchmarkCase {
    let runtime = JavaScriptRuntime()
    try withExtendedLifetime(runtime) {
      let decoder = ViewPropsDecoder<Props>(viewName: "BenchmarkView")
      let props = try runtime.eval("(\(source))")
      let previous = DecodedViewProps(props: Props(), changedProps: [], previous: nil)
      try runtime.withUnsafePointee { runtimePointer in
        try props.withUnsafePointee { propsPointer in
          try body {
            decoder.decode(propsPointer: propsPointer, runtimePointer: runtimePointer, previous: previous)
          }
        }
      }
    }
  }
}

@ViewProps
private struct DecoderBenchmarkProps {
  var title = ""
  var subtitle = ""
  var color = ""
  var progress = 0.0
  var radius = 0.0
  var count = 0
  var enabled = false
}

@ViewProps
private struct WideBenchmarkProps {
  var prop0 = ""
  var prop1 = ""
  var prop2 = ""
  var prop3 = ""
  var prop4 = ""
  var prop5 = ""
  var prop6 = ""
  var prop7 = ""
  var prop8 = ""
  var prop9 = ""
  var prop10 = ""
  var prop11 = ""
  var prop12 = ""
  var prop13 = ""
  var prop14 = ""
  var prop15 = ""
  var prop16 = ""
  var prop17 = ""
  var prop18 = ""
  var prop19 = ""
}

/// Props whose defaults allocate: each array and dictionary default makes a new buffer.
@ViewProps
private struct ExpensiveDefaultsBenchmarkProps {
  var text0 = "Default text number 0"
  var tags0: [String] = ["first", "second", "third"]
  var weights0: [Double] = [0.25, 0.5, 0.75, 1.0]
  var labels0: [String: String] = ["start": "Start", "end": "End"]
  var insets0: [Double] = [8, 8, 8, 8]
  var text1 = "Default text number 1"
  var tags1: [String] = ["first", "second", "third"]
  var weights1: [Double] = [0.25, 0.5, 0.75, 1.0]
  var labels1: [String: String] = ["start": "Start", "end": "End"]
  var insets1: [Double] = [8, 8, 8, 8]
  var text2 = "Default text number 2"
  var tags2: [String] = ["first", "second", "third"]
  var weights2: [Double] = [0.25, 0.5, 0.75, 1.0]
  var labels2: [String: String] = ["start": "Start", "end": "End"]
  var insets2: [Double] = [8, 8, 8, 8]
  var text3 = "Default text number 3"
  var tags3: [String] = ["first", "second", "third"]
  var weights3: [Double] = [0.25, 0.5, 0.75, 1.0]
  var labels3: [String: String] = ["start": "Start", "end": "End"]
  var insets3: [Double] = [8, 8, 8, 8]
}
