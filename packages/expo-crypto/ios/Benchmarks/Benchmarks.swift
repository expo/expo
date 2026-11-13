// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoCrypto
import ExpoModulesCore
import ExpoModulesTestCore
import Testing

/// Umbrella suite for the ExpoCrypto benchmarks.
///
/// The benchmarks are the `Benchmarks` test spec of the pod, separate from the unit tests. Run them
/// with `et native-unit-tests -p ios --packages expo-crypto --benchmarks`, which builds the pods in
/// the Release configuration and runs the bundle natively on the Mac through the Mac Catalyst
/// destination. Each case prints one `[benchmark]` line with the median and minimum ns/op.
///
/// The suite is serialized so only one benchmark runs at a time: the `JavaScriptActor` executor runs
/// jobs synchronously on the calling thread, so cases running in parallel would disturb each other's
/// measurements.
@Suite(.serialized)
struct Benchmarks {}

/// End-to-end benchmarks for JavaScript using the native AES module. A JavaScript driver runs the
/// measured loop against `expo.modules.ExpoCryptoAES`, so each operation covers the engine's call
/// dispatch, argument decoding, the native work and encoding the result back. The drivers pass the
/// arguments the way `src/aes/index.ts` does: `aesEncryptAsync` passes `{}` when the caller gives no
/// options and the nonce and the additional data as base64 strings, and `aesDecryptAsync` passes
/// `{ additionalData: undefined }`.
///
/// Read the synchronous cases against `JS: empty driver loop`, and the cases that await a promise
/// against `JS: empty async driver loop`.
extension Benchmarks {
  @Test
  func `JS: empty driver loop`() async throws {
    try await aesBenchmark("JS: empty driver loop", body: "")
  }

  @Test
  func `size read`() async throws {
    try await aesBenchmark("key.size", body: "key.size;")
  }

  @Test
  func `ivSize read`() async throws {
    try await aesBenchmark("sealedData.ivSize", body: "sealedData.ivSize;")
  }

  @Test
  func `fromCombined with 44 bytes`() async throws {
    try await aesBenchmark("SealedData.fromCombined (44 B)", body: "AES.SealedData.fromCombined(combined, undefined);")
  }

  @Test
  func `fromParts with a tag`() async throws {
    try await aesBenchmark("SealedData.fromParts with a tag", body: "AES.SealedData.fromParts(iv, ciphertext, tag);")
  }

  @Test
  func `JS: empty async driver loop`() async throws {
    try await aesBenchmark("JS: empty async driver loop", body: "await null;")
  }

  @Test
  func `generate a key`() async throws {
    try await aesBenchmark("await EncryptionKey.generate()", body: "await AES.EncryptionKey.generate();")
  }

  @Test
  func `import key bytes`() async throws {
    try await aesBenchmark("await EncryptionKey.import (32 B)", body: "await AES.EncryptionKey.import(keyBytes);")
  }

  @Test
  func `export key bytes`() async throws {
    try await aesBenchmark("await key.bytes()", body: "await key.bytes();")
  }

  @Test
  func `combined as bytes`() async throws {
    try await aesBenchmark("await sealedData.combined()", body: "await sealedData.combined();")
  }

  @Test
  func `combined as base64`() async throws {
    try await aesBenchmark("await sealedData.combined('base64')", body: "await sealedData.combined('base64');")
  }

  @Test
  func `encrypt 16 bytes`() async throws {
    try await aesBenchmark("await encryptAsync (16 B)", body: "await AES.encryptAsync(smallPlaintext, key, {});")
  }

  @Test
  func `encrypt 16 bytes with a nonce and additional data`() async throws {
    try await aesBenchmark(
      "await encryptAsync (16 B) with nonce and AAD",
      body: "await AES.encryptAsync(smallPlaintext, key, encryptOptions);"
    )
  }

  @Test
  func `decrypt 16 bytes`() async throws {
    try await aesBenchmark("await decryptAsync (16 B)", body: "await AES.decryptAsync(sealedData, key, decryptOptions);")
  }

  @Test
  func `encrypt 1 MiB`() async throws {
    try await aesBenchmark("await encryptAsync (1 MiB)", body: "await AES.encryptAsync(bigPlaintext, key, {});")
  }

  @Test
  func `decrypt 1 MiB`() async throws {
    try await aesBenchmark("await decryptAsync (1 MiB)", body: "await AES.decryptAsync(bigSealedData, key, decryptOptions);")
  }
}

/// The globals every case can use, created once before the driver runs:
/// - `AES`: the native module.
/// - `keyBytes` and `key`: a 256-bit key, as bytes and as an `EncryptionKey`.
/// - `smallPlaintext` and `bigPlaintext`: a 16-byte and a 1 MiB `Uint8Array`.
/// - `sealedData` and `bigSealedData`: the two plaintexts encrypted with `key`.
/// - `combined`, `iv`, `ciphertext` and `tag`: the parts of `sealedData` as bytes.
/// - `encryptOptions` and `decryptOptions`: the options that `src/aes/index.ts` passes.
private let fixtures = """
  var AES = expo.modules.ExpoCryptoAES;
  var keyBytes = new Uint8Array(32).fill(7);
  var smallPlaintext = new Uint8Array(16).fill(1);
  var bigPlaintext = new Uint8Array(1024 * 1024).fill(1);
  var encryptOptions = { nonce: 'CQkJCQkJCQkJCQkJ', additionalData: 'ChQeKA==' };
  var decryptOptions = { additionalData: undefined };
  var key, sealedData, bigSealedData, combined, iv, ciphertext, tag;
  (async function () {
    key = await AES.EncryptionKey.import(keyBytes);
    sealedData = await AES.encryptAsync(smallPlaintext, key, {});
    bigSealedData = await AES.encryptAsync(bigPlaintext, key, {});
    combined = await sealedData.combined();
    iv = await sealedData.iv();
    ciphertext = await sealedData.ciphertext();
    tag = await sealedData.tag();
  })()
  """

/// Measures `body` with the `ExpoCryptoAES` module registered and the `fixtures` created. The runtime
/// of a `TestAppContext` has its own JavaScript thread, which the fixtures need to await the async
/// members, and async functions settle their promises there. Each batch runs an async driver on that
/// thread, which runs `body` once per iteration, and blocks until the driver's promise settles. When
/// `body` awaits an async member, a result is the time from one call to its settled promise.
private func aesBenchmark(_ name: String, body: String) async throws {
  try await benchmarkCase {
    let appContext = TestAppContext()
    appContext.moduleRegistry.register(module: AesCryptoModule(appContext: appContext), name: nil)
    let runtime = try appContext.runtime
    try runtime.execute { () async throws -> Void in
      _ = try await runtime.eval(fixtures).getPromise().await()
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
