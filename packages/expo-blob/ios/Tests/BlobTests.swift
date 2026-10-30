// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import ExpoBlob
@testable import ExpoModulesCore

@Suite("Blob")
@JavaScriptActor
struct BlobTests {
  let appContext: AppContext
  let runtime: ExpoRuntime

  init() throws {
    appContext = TestAppContext()
    runtime = try appContext.runtime
    appContext.moduleRegistry.register(module: ExpoBlob(appContext: appContext), name: nil)
  }

  // MARK: - Native state

  @Test
  func `decodes each kind of part into its own native part`() async throws {
    let parts = try await inspect(
      "new Blob(['text', new Blob(['inner'], undefined), new Uint8Array([1, 2]), new Int16Array([1, 256])], undefined)"
    ) { describe($0.blobParts) }

    // An `Int16Array` part keeps its bytes in platform (little-endian) order.
    #expect(parts == ["string:text", "blob:5", "data:[1, 2]", "data:[1, 0, 0, 1]"])
  }

  @Test
  func `copies only the bytes in view of a typed array, at construction`() async throws {
    let parts = try await inspect(
      """
      (function () {
        var bytes = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);
        var view = new Uint8Array(bytes.buffer, 2, 3);
        var blob = new Blob([view], undefined);
        view[0] = 99;
        return blob;
      })()
      """
    ) { describe($0.blobParts) }

    #expect(parts == ["data:[2, 3, 4]"])
  }

  @Test(arguments: [
    ("new Blob([], undefined)", "", "transparent"),
    ("new Blob([], { type: 'text/plain', endings: 'native' })", "text/plain", "native"),
  ])
  func `reads the options or falls back to the defaults`(
    source: String,
    type: String,
    endings: String
  ) async throws {
    let options = try await inspect(source) { ($0.options.type, $0.options.endings.rawValue) }

    #expect(options.0 == type)
    #expect(options.1 == endings)
  }

  // The parts are "ab", a nested 4-byte blob with "cdef", and "gh".
  @Test(arguments: [
    // The range covers the nested blob, so the slice keeps that blob as a part.
    ("slice(1, 7, '')", ["data:[98]", "blob:4", "data:[103]"]),
    // The range is inside the nested blob, so the slice gets a new blob sliced from it.
    ("slice(3, 5, '')", ["blob:2"]),
  ])
  func `slicing keeps whole parts and slices the partial ones`(slice: String, expected: [String]) async throws {
    let parts = try await inspect(
      "new Blob(['ab', new Blob(['cdef'], undefined), 'gh'], undefined).\(slice)"
    ) { describe($0.blobParts) }

    #expect(parts == expected)
  }

  @Test
  func `reports its size in UTF-8 bytes as additional memory pressure`() async throws {
    let (size, memoryPressure) = try await inspect(
      "new Blob(['żółw', new Uint8Array(1000)], undefined)"
    ) { ($0.size, $0.getAdditionalMemoryPressure()) }

    // "żółw" is 7 bytes in UTF-8.
    #expect(size == 1007)
    #expect(memoryPressure == 1007)
  }

  // MARK: - Native helpers

  // Swift reads "\r\n" as a single `Character`, so this checks that it becomes one newline, not two.
  @Test(arguments: [
    ("a\r\nb", "a\nb"),
    ("a\rb", "a\nb"),
    ("a\nb", "a\nb"),
    ("\r\r\n\n", "\n\n\n"),
  ])
  func `converts CRLF and CR to LF`(input: String, expected: String) {
    #expect(toNativeNewlines(input) == expected)
  }

  // MARK: - Async functions

  @Test
  func `text replaces invalid UTF-8 sequences`() async throws {
    let result = try await runtime.evalAsync(
      "new expo.modules.ExpoBlob.Blob([new Uint8Array([104, 255, 105])], undefined).text()"
    ).ref()

    // `evalAsync` resumes off the JavaScript thread, so the result is read on it.
    #expect(try await runtime.execute { try result.take().asString() } == "h\u{FFFD}i")
  }

  // MARK: - Helpers

  /// Evaluates `source`, which creates a blob in JavaScript, and reads the native `Blob` paired with
  /// it. Both run on the JavaScript thread.
  private func inspect<Result: Sendable>(
    _ source: String,
    _ read: @escaping @JavaScriptActor (Blob) throws -> Result
  ) async throws -> Result {
    return try await runtime.execute {
      let object = try runtime.eval("var Blob = expo.modules.ExpoBlob.Blob; \(source)").asObject()
      guard let blob = try SharedObject.native(from: object) as? Blob else {
        throw NotABlobError()
      }
      return try read(blob)
    }
  }
}

private struct NotABlobError: Error {}

private func describe(_ parts: [BlobPart]) -> [String] {
  return parts.map { part in
    switch part {
    case .string(let string):
      return "string:\(string)"
    case .blob(let blob):
      return "blob:\(blob.size)"
    case .data(let data):
      return "data:\([UInt8](data))"
    }
  }
}
