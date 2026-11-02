// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoBlob
import ExpoModulesCore
import ExpoModulesTestCore
import Testing

/// Umbrella suite for the ExpoBlob benchmarks.
///
/// The benchmarks are the `Benchmarks` test spec of the pod, separate from the unit tests. Run them
/// with `et native-unit-tests -p ios --packages expo-blob --benchmarks`, which builds the pods in
/// the Release configuration and runs the bundle natively on the Mac through the Mac Catalyst
/// destination. Each case prints one `[benchmark]` line with the median and minimum ns/op.
///
/// The suite is serialized so only one benchmark runs at a time: the `JavaScriptActor` executor runs
/// jobs synchronously on the calling thread, so cases running in parallel would disturb each other's
/// measurements.
@Suite(.serialized)
struct Benchmarks {}

/// End-to-end benchmarks for JavaScript using the native `Blob` class. A JavaScript driver runs the
/// measured loop against `expo.modules.ExpoBlob.Blob`, which the `Blob` class in `src/` extends, so
/// each operation covers the engine's call dispatch, argument decoding, the native work and encoding
/// the result back. The drivers pass the arguments the way that class does: the constructor always
/// gets the parts array and the options, which are `undefined` when the caller passes none. Read
/// every result against `JS: empty driver loop`.
///
/// The cases for the async `text()` and `bytes()` await each call, see `blobAsyncBenchmark`. Read
/// them against `JS: empty async driver loop`.
extension Benchmarks {
  @Test
  func `JS: empty driver loop`() async throws {
    try await blobBenchmarkCase(body: "") { run, runtime in
      try benchmark("JS: empty driver loop", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `new Blob: no parts`() async throws {
    try await blobBenchmarkCase(body: "new Blob([], undefined);") { run, runtime in
      try benchmark("new Blob: no parts", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `new Blob: one string part`() async throws {
    try await blobBenchmarkCase(body: "new Blob(['hello'], undefined);") { run, runtime in
      try benchmark("new Blob: 1 string part", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `new Blob: one string part and options`() async throws {
    try await blobBenchmarkCase(body: "new Blob(['hello'], options);") { run, runtime in
      try benchmark("new Blob: 1 string part and options", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `new Blob: one 1 KiB Uint8Array part`() async throws {
    try await blobBenchmarkCase(body: "new Blob([bytes], undefined);") { run, runtime in
      try benchmark("new Blob: 1 Uint8Array part (1 KiB)", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `new Blob: one Blob part`() async throws {
    try await blobBenchmarkCase(body: "new Blob([blob], undefined);") { run, runtime in
      try benchmark("new Blob: 1 Blob part", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `new Blob: ten mixed parts`() async throws {
    try await blobBenchmarkCase(body: "new Blob(mixedParts, options);") { run, runtime in
      try benchmark("new Blob: 10 mixed parts and options", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `new Blob: one 1 MiB Uint8Array part`() async throws {
    try await blobBenchmarkCase(body: "new Blob([bigBytes], undefined);") { run, runtime in
      try benchmark("new Blob: 1 Uint8Array part (1 MiB)", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `new Blob: one 1 MiB string part`() async throws {
    try await blobBenchmarkCase(body: "new Blob([bigString], undefined);") { run, runtime in
      try benchmark("new Blob: 1 string part (1 MiB)", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `new Blob: 1,000 string parts`() async throws {
    try await blobBenchmarkCase(body: "new Blob(manyParts, undefined);") { run, runtime in
      try benchmark("new Blob: 1,000 string parts", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `size read`() async throws {
    try await blobBenchmarkCase(body: "blob.size;") { run, runtime in
      try benchmark("blob.size", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `type read`() async throws {
    try await blobBenchmarkCase(body: "blob.type;") { run, runtime in
      try benchmark("blob.type", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `slice`() async throws {
    try await blobBenchmarkCase(body: "blob.slice(1, 4, 'text/plain');") { run, runtime in
      try benchmark("blob.slice(1, 4, 'text/plain')", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `size read on a blob with 1,000 parts`() async throws {
    try await blobBenchmarkCase(body: "manyPartsBlob.size;") { run, runtime in
      try benchmark("blob.size (1,000 parts)", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `slice of a 1 MiB blob`() async throws {
    try await blobBenchmarkCase(body: "bigBlob.slice(1024, 1024 + 512 * 1024, '');") { run, runtime in
      try benchmark("blob.slice: 512 KiB of a 1 MiB blob", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `slice of a blob with 1,000 parts`() async throws {
    try await blobBenchmarkCase(body: "manyPartsBlob.slice(2, 3998, '');") { run, runtime in
      try benchmark("blob.slice: 3,996 bytes of a 1,000-part blob", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `JS: empty async driver loop`() async throws {
    try await blobAsyncBenchmark("JS: empty async driver loop", body: "await null;")
  }

  @Test
  func `text: 12-byte blob`() async throws {
    try await blobAsyncBenchmark("await blob.text() (12 B)", body: "await blob.text();")
  }

  @Test
  func `bytes: 12-byte blob`() async throws {
    try await blobAsyncBenchmark("await blob.bytes() (12 B)", body: "await blob.bytes();")
  }

  @Test
  func `text: 1 MiB blob`() async throws {
    try await blobAsyncBenchmark("await blob.text() (1 MiB)", body: "await bigBlob.text();")
  }

  @Test
  func `bytes: 1 MiB blob`() async throws {
    try await blobAsyncBenchmark("await blob.bytes() (1 MiB)", body: "await bigBlob.bytes();")
  }
}

/// The globals every case can use, created once before the driver runs:
/// - `Blob`: the native class.
/// - `blob`: a 12-byte blob.
/// - `bytes` and `bigBytes`: a 1 KiB and a 1 MiB `Uint8Array`.
/// - `bigString`: a 1 MiB ASCII string.
/// - `bigBlob`: a blob with one 1 MiB part.
/// - `manyParts` and `manyPartsBlob`: 1,000 four-character strings, and a blob made of them.
/// - `mixedParts`: ten parts of every kind.
/// - `options`: the options the `Blob` class in `src/` passes.
private let fixtures = """
  var Blob = expo.modules.ExpoBlob.Blob;
  var blob = new Blob(['hello, world'], undefined);
  var bytes = new Uint8Array(1024);
  var bigBytes = new Uint8Array(1024 * 1024);
  var bigString = 'a'.repeat(1024 * 1024);
  var bigBlob = new Blob([bigBytes], undefined);
  var manyParts = [];
  for (var k = 0; k < 1000; k++) { manyParts.push('part'); }
  var manyPartsBlob = new Blob(manyParts, undefined);
  var options = { type: 'text/plain', endings: 'transparent' };
  var mixedParts = [];
  for (var k = 0; k < 10; k++) { mixedParts.push(k % 3 === 0 ? 'part' : k % 3 === 1 ? bytes : blob); }
  """

/// Runs one case with the `ExpoBlob` module registered, the `fixtures` and a JavaScript driver that
/// runs `body` in a loop.
private func blobBenchmarkCase(
  body: String,
  _ measure: @escaping @JavaScriptActor (borrowing JavaScriptFunction, JavaScriptRuntime) throws -> Void
) async throws {
  try await moduleBenchmarkCase { appContext in
    return ExpoBlob(appContext: appContext)
  } _: { _, runtime in
    _ = try runtime.eval(fixtures)
    let run = try javaScriptDriver(runtime, body: body)
    try measure(run, runtime)
  }
}

/// Measures `body`, which awaits an async member, with the `fixtures` and the `ExpoBlob` module
/// registered. The runtime of a `TestAppContext` has its own JavaScript thread, so async functions
/// settle their promises there instead of on the thread that finished the native work. Each batch
/// runs an async driver on that thread, which awaits `body` once per iteration, and blocks until the
/// driver's promise settles. A result is the time from one call to its settled promise.
private func blobAsyncBenchmark(_ name: String, body: String) async throws {
  try await benchmarkCase {
    let appContext = TestAppContext()
    appContext.moduleRegistry.register(module: ExpoBlob(appContext: appContext), name: nil)
    let runtime = try appContext.runtime
    try runtime.execute { () throws -> Void in
      _ = try runtime.eval(fixtures)
      _ = try runtime.eval("var run = async function (n) { for (var i = 0; i < n; i++) { \(body) } };")
    }
    try withExtendedLifetime(appContext) {
      try benchmark(name, runtime: runtime) { iterations in
        try runtime.execute { () async throws -> Void in
          _ = try await runtime.eval("run(\(iterations))").getPromise().await()
        }
      }
    }
  }
}
