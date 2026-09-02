// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

@testable import ExpoModulesCore

@Suite("JavaScriptCodable+SharedObject")
@JavaScriptActor
struct JavaScriptCodableSharedObjectTests {
  let appContext = AppContext.create()

  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  // MARK: - encode

  @Test
  func `encodes a native shared object to a registered JS object`() throws {
    let runtime = try runtime
    let registrySizeBefore = appContext.sharedObjectRegistry.size
    let native = CodableSharedObject()

    let encoded = try CodableSharedObject.encode(native, in: runtime)

    #expect(encoded.kind == .object)
    #expect(appContext.sharedObjectRegistry.size == registrySizeBefore + 1)
    // The native object is now paired with the JS object it encoded to. The nil check runs outside
    // `#expect` because `getJavaScriptObject()` returns a `~Copyable` optional the macro can't capture.
    let isPaired = native.getJavaScriptObject() != nil
    #expect(isPaired)
  }

  @Test
  func `encoding the same object twice returns the existing JS object`() throws {
    let runtime = try runtime
    let native = CodableSharedObject()

    let first = try CodableSharedObject.encode(native, in: runtime)
    let registrySizeAfterFirst = appContext.sharedObjectRegistry.size
    let second = try CodableSharedObject.encode(native, in: runtime)

    // The second encode reuses the already-paired JS object rather than registering a new one.
    // `JavaScriptValue` equality is JS strict equality, so two values wrapping the same object are equal.
    #expect(first == second)
    #expect(appContext.sharedObjectRegistry.size == registrySizeAfterFirst)
  }

  // MARK: - decode

  @Test
  func `round-trips a shared object through its JS object`() throws {
    let runtime = try runtime
    let native = CodableSharedObject()
    let encoded = try CodableSharedObject.encode(native, in: runtime)

    let decoded = try CodableSharedObject.decode(encoded, in: runtime)

    #expect(decoded === native)
  }

  @Test
  func `decode throws a type mismatch when the native object is a different subclass`() throws {
    let runtime = try runtime
    let native = CodableSharedObject()
    let encoded = try CodableSharedObject.encode(native, in: runtime)

    // The JS object is paired with a `CodableSharedObject`, so decoding it as a different subclass mismatches.
    #expect(throws: SharedObject.TypeMismatchException.self) {
      _ = try OtherCodableSharedObject.decode(encoded, in: runtime)
    }
  }

  @Test
  func `decode throws not-found for a foreign object`() throws {
    let runtime = try runtime
    // A plain object carries no paired native shared object.
    let foreign = try runtime.eval("({})")

    #expect(throws: SharedObject.NotFoundException.self) {
      _ = try CodableSharedObject.decode(foreign, in: runtime)
    }
  }

  @Test
  func `decodes from a borrowed argument buffer`() throws {
    // `decode` resolves to the defaulted borrowing `JavaScriptUnownedValue` overload (the fast path the
    // macro emits for arguments), which materializes an owning value and forwards to the requirement.
    let runtime = try runtime
    let native = CodableSharedObject()
    let encoded = try CodableSharedObject.encode(native, in: runtime)
    let buffer = JavaScriptValuesBuffer.copying(in: runtime, values: [encoded])

    let decoded = try CodableSharedObject.decode(buffer.unownedValue(at: 0), in: runtime)

    #expect(decoded === native)
  }

  @Test
  func `decode does not need an app context`() throws {
    // `decode` reads the native object off the JS object's native state, so it works even on a runtime
    // the app context never prepared. The object is encoded (and so paired) with the prepared runtime,
    // then decoded with a bare one to prove the decode path itself never touches the app context.
    let native = CodableSharedObject()
    let encoded = try CodableSharedObject.encode(native, in: runtime)

    let decoded = try CodableSharedObject.decode(encoded, in: JavaScriptRuntime())

    #expect(decoded === native)
  }

  // MARK: - SharedRef

  @Test
  func `round-trips a shared ref`() throws {
    let runtime = try runtime
    let native = CodableSharedRef(42)

    let encoded = try CodableSharedRef.encode(native, in: runtime)
    let decoded = try CodableSharedRef.decode(encoded, in: runtime)

    #expect(decoded === native)
    #expect(decoded.ref == 42)
  }

  // MARK: - Missing app context

  @Test
  func `encode throws when the runtime has no app context`() throws {
    let bareRuntime = JavaScriptRuntime()
    let native = CodableSharedObject()

    #expect(throws: Exceptions.AppContextNotFound.self) {
      _ = try CodableSharedObject.encode(native, in: bareRuntime)
    }
  }
}

// MARK: - Test Helpers

private final class CodableSharedObject: SharedObject {}

/// A second, unrelated subclass used to exercise the type-mismatch path of `decode`.
private final class OtherCodableSharedObject: SharedObject {}

/// A `SharedRef` subclass used to exercise the `AnySharedRef` branch of the encode path.
private final class CodableSharedRef: SharedRef<Int> {
  override var nativeRefType: String {
    "codable-test"
  }
}
