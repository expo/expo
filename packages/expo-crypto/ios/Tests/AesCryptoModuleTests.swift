// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import ExpoCrypto
@testable import ExpoModulesCore

/// Calls the AES module from JavaScript, so the arguments and the results go through the same
/// conversions as in an app.
@Suite("AesCryptoModule")
@JavaScriptActor
struct AesCryptoModuleTests {
  let appContext: AppContext
  let runtime: ExpoRuntime

  init() throws {
    appContext = TestAppContext()
    runtime = try appContext.runtime
    appContext.moduleRegistry.register(
      holder: ModuleHolder(
        appContext: appContext,
        module: AesCryptoModule(appContext: appContext),
        name: "ExpoCryptoAES"
      )
    )
    _ = try runtime.eval(
      """
      var AES = expo.modules.ExpoCryptoAES;
      var key = new Uint8Array(32).fill(7);
      var nonce = new Uint8Array(12).fill(9);
      var plaintext = new Uint8Array([1, 2, 3, 4, 5]);
      var additionalData = new Uint8Array([10, 20, 30, 40]);
      function hex(bytes) {
        return Array.from(bytes, function (byte) {
          return byte.toString(16).padStart(2, '0');
        }).join('');
      }
      function fromHex(string) {
        return new Uint8Array(string.match(/../g).map(function (pair) {
          return parseInt(pair, 16);
        }));
      }
      function join(values) {
        return values.join(' ');
      }
      function encrypt(input, options) {
        return AES.EncryptionKey.import(key).then(function (encryptionKey) {
          return AES.encryptAsync(input, encryptionKey, options);
        });
      }
      function decrypt(sealedData, options) {
        return AES.EncryptionKey.import(key).then(function (encryptionKey) {
          return AES.decryptAsync(sealedData, encryptionKey, options);
        });
      }
      // Resolves to the nonce, the ciphertext and the tag in hex, separated by spaces.
      function partsInHex(sealedData) {
        return Promise.all([sealedData.iv(), sealedData.ciphertext(), sealedData.tag()]).then(function (parts) {
          return parts.map(hex).join(' ');
        });
      }
      // Resolves to the code of the error that rejects the promise, or to 'resolved'.
      function rejectionCode(promise) {
        return promise.then(
          function () {
            return 'resolved';
          },
          function (error) {
            return String(error.code);
          }
        );
      }
      // For errors whose code comes from Expo Modules Core rather than from this module.
      function rejects(promise) {
        return promise.then(
          function () {
            return false;
          },
          function () {
            return true;
          }
        );
      }
      """
    )
  }

  // MARK: - EncryptionKey

  @Test
  func `generate creates a 256-bit EncryptionKey by default`() async throws {
    let result = try await runtime.evalAsync(
      """
      AES.EncryptionKey.generate().then(function (encryptionKey) {
        return join([encryptionKey instanceof AES.EncryptionKey, encryptionKey.size]);
      })
      """
    )
    #expect(try result.asString() == "true 256")
  }

  @Test
  func `generate creates a key of each supported size`() async throws {
    let result = try await runtime.evalAsync(
      """
      Promise.all([128, 192, 256].map(function (size) {
        return AES.EncryptionKey.generate(size);
      })).then(function (keys) {
        return join(keys.map(function (encryptionKey) {
          return encryptionKey.size;
        }));
      })
      """
    )
    #expect(try result.asString() == "128 192 256")
  }

  @Test
  func `generate rejects an unsupported key size`() async throws {
    let result = try await runtime.evalAsync("rejects(AES.EncryptionKey.generate(100))")
    #expect(try result.asBool() == true)
  }

  @Test
  func `import accepts key bytes of each supported size`() async throws {
    let result = try await runtime.evalAsync(
      """
      Promise.all([16, 24, 32].map(function (length) {
        return AES.EncryptionKey.import(new Uint8Array(length));
      })).then(function (keys) {
        return join(keys.map(function (encryptionKey) {
          return encryptionKey.size;
        }));
      })
      """
    )
    #expect(try result.asString() == "128 192 256")
  }

  @Test
  func `import accepts hex and base64 strings`() async throws {
    let result = try await runtime.evalAsync(
      """
      Promise.all([
        AES.EncryptionKey.import('\(Reference.keyHex)', 'hex'),
        AES.EncryptionKey.import('\(Reference.keyBase64)', 'base64'),
      ]).then(function (keys) {
        return Promise.all(keys.map(function (encryptionKey) {
          return encryptionKey.bytes().then(hex);
        }));
      }).then(join)
      """
    )
    #expect(try result.asString() == "\(Reference.keyHex) \(Reference.keyHex)")
  }

  @Test
  func `bytes and encoded export the key`() async throws {
    let result = try await runtime.evalAsync(
      """
      AES.EncryptionKey.import(key).then(function (encryptionKey) {
        return Promise.all([
          encryptionKey.bytes().then(hex),
          encryptionKey.encoded('hex'),
          encryptionKey.encoded('base64'),
        ]);
      }).then(join)
      """
    )
    #expect(try result.asString() == "\(Reference.keyHex) \(Reference.keyHex) \(Reference.keyBase64)")
  }

  @Test
  func `import rejects a key of an unsupported length`() async throws {
    let result = try await runtime.evalAsync("rejectionCode(AES.EncryptionKey.import(new Uint8Array(15)))")
    #expect(try result.asString() == "ERR_INVALID_KEY_SIZE")
  }

  @Test
  func `import rejects a string key without an encoding`() async throws {
    let result = try await runtime.evalAsync("rejectionCode(AES.EncryptionKey.import('\(Reference.keyHex)'))")
    #expect(try result.asString() == "ERR_MISSING_ENCODING")
  }

  @Test
  func `import rejects a string key that isn't valid base64`() async throws {
    let result = try await runtime.evalAsync("rejectionCode(AES.EncryptionKey.import('not base64', 'base64'))")
    #expect(try result.asString() == "ERR_INVALID_KEY_FORMAT")
  }

  // MARK: - encryptAsync

  @Test
  func `encryptAsync matches the reference output`() async throws {
    let result = try await runtime.evalAsync("encrypt(plaintext, { nonce: nonce }).then(partsInHex)")
    #expect(try result.asString() == "\(Reference.nonceHex) \(Reference.ciphertextHex) \(Reference.tagHex)")
  }

  @Test
  func `encryptAsync accepts the nonce as a base64 string`() async throws {
    let result = try await runtime.evalAsync("encrypt(plaintext, { nonce: '\(Reference.nonceBase64)' }).then(partsInHex)")
    #expect(try result.asString() == "\(Reference.nonceHex) \(Reference.ciphertextHex) \(Reference.tagHex)")
  }

  @Test
  func `encryptAsync accepts the plaintext as a base64 string`() async throws {
    let result = try await runtime.evalAsync("encrypt('\(Reference.plaintextBase64)', { nonce: nonce }).then(partsInHex)")
    #expect(try result.asString() == "\(Reference.nonceHex) \(Reference.ciphertextHex) \(Reference.tagHex)")
  }

  @Test
  func `encryptAsync generates a 12-byte nonce by default`() async throws {
    let result = try await runtime.evalAsync(
      """
      encrypt(plaintext).then(function (sealedData) {
        return join([
          sealedData instanceof AES.SealedData,
          sealedData.ivSize,
          sealedData.tagSize,
          sealedData.combinedSize,
        ]);
      })
      """
    )
    #expect(try result.asString() == "true 12 16 33")
  }

  @Test
  func `encryptAsync generates a nonce of the requested length`() async throws {
    let result = try await runtime.evalAsync(
      """
      encrypt(plaintext, { nonce: 16 }).then(function (sealedData) {
        return Promise.all([sealedData.ivSize, decrypt(sealedData).then(hex)]);
      }).then(join)
      """
    )
    #expect(try result.asString() == "16 \(Reference.plaintextHex)")
  }

  @Test
  func `encryptAsync authenticates the additional data as bytes or a base64 string`() async throws {
    let result = try await runtime.evalAsync(
      """
      Promise.all([
        encrypt(plaintext, { nonce: nonce, additionalData: additionalData }),
        encrypt(plaintext, { nonce: nonce, additionalData: '\(Reference.additionalDataBase64)' }),
      ]).then(function (sealedData) {
        return Promise.all(sealedData.map(function (item) {
          return item.tag().then(hex);
        }));
      }).then(join)
      """
    )
    #expect(try result.asString() == "\(Reference.tagWithAdditionalDataHex) \(Reference.tagWithAdditionalDataHex)")
  }

  @Test
  func `encryptAsync rejects a plaintext string that isn't valid base64`() async throws {
    let result = try await runtime.evalAsync("rejectionCode(encrypt('not base64'))")
    #expect(try result.asString() == "ERR_INVALID_BASE64")
  }

  // MARK: - decryptAsync

  @Test
  func `decryptAsync returns bytes by default and base64 on request`() async throws {
    let result = try await runtime.evalAsync(
      """
      encrypt(plaintext).then(function (sealedData) {
        return Promise.all([
          decrypt(sealedData).then(hex),
          decrypt(sealedData, { output: 'bytes' }).then(hex),
          decrypt(sealedData, { output: 'base64' }),
        ]);
      }).then(join)
      """
    )
    #expect(try result.asString() == "\(Reference.plaintextHex) \(Reference.plaintextHex) \(Reference.plaintextBase64)")
  }

  @Test
  func `decryptAsync verifies the additional data`() async throws {
    let result = try await runtime.evalAsync(
      """
      encrypt(plaintext, { additionalData: additionalData }).then(function (sealedData) {
        return Promise.all([
          decrypt(sealedData, { additionalData: '\(Reference.additionalDataBase64)' }).then(hex),
          rejects(decrypt(sealedData, { additionalData: new Uint8Array([1]) })),
          rejects(decrypt(sealedData)),
        ]);
      }).then(join)
      """
    )
    #expect(try result.asString() == "\(Reference.plaintextHex) true true")
  }

  @Test
  func `decryptAsync rejects a different key`() async throws {
    let result = try await runtime.evalAsync(
      """
      Promise.all([encrypt(plaintext), AES.EncryptionKey.generate()]).then(function (values) {
        return rejects(AES.decryptAsync(values[0], values[1]));
      })
      """
    )
    #expect(try result.asBool() == true)
  }

  // MARK: - SealedData

  @Test
  func `SealedData exports its parts as base64`() async throws {
    let result = try await runtime.evalAsync(
      """
      encrypt(plaintext, { nonce: nonce }).then(function (sealedData) {
        return Promise.all([
          sealedData.iv('base64'),
          sealedData.ciphertext({ outputFormat: 'base64' }),
          sealedData.tag('base64'),
          sealedData.combined('base64'),
        ]);
      }).then(join)
      """
    )
    #expect(
      try result.asString()
        == "\(Reference.nonceBase64) \(Reference.ciphertextBase64) \(Reference.tagBase64) \(Reference.combinedBase64)"
    )
  }

  @Test
  func `ciphertext appends the tag on request`() async throws {
    let result = try await runtime.evalAsync(
      """
      encrypt(plaintext, { nonce: nonce }).then(function (sealedData) {
        return Promise.all([
          sealedData.ciphertext({ includeTag: false }),
          sealedData.ciphertext({ includeTag: true }),
        ]);
      }).then(function (values) {
        return join(values.map(hex));
      })
      """
    )
    #expect(try result.asString() == "\(Reference.ciphertextHex) \(Reference.ciphertextHex)\(Reference.tagHex)")
  }

  @Test
  func `fromCombined accepts bytes and a base64 string`() async throws {
    let result = try await runtime.evalAsync(
      """
      Promise.all([
        AES.SealedData.fromCombined(fromHex('\(Reference.nonceHex)\(Reference.ciphertextHex)\(Reference.tagHex)')),
        AES.SealedData.fromCombined('\(Reference.combinedBase64)'),
      ].map(partsInHex)).then(join)
      """
    )
    let parts = "\(Reference.nonceHex) \(Reference.ciphertextHex) \(Reference.tagHex)"
    #expect(try result.asString() == "\(parts) \(parts)")
  }

  @Test
  func `fromCombined splits the nonce and the tag by the given lengths`() async throws {
    let result = try await runtime.evalAsync(
      """
      (function () {
        var sealedData = AES.SealedData.fromCombined('\(Reference.longNonceCombinedBase64)', { ivLength: 16, tagLength: 16 });
        return Promise.all([
          partsInHex(sealedData),
          sealedData.combined('base64'),
          decrypt(sealedData).then(hex),
        ]).then(join);
      })()
      """
    )
    #expect(
      try result.asString()
        == "\(Reference.longNonceHex) \(Reference.longNonceCiphertextHex) \(Reference.longNonceTagHex) \(Reference.longNonceCombinedBase64) \(Reference.plaintextHex)"
    )
  }

  @Test
  func `fromParts accepts a separate tag`() async throws {
    let result = try await runtime.evalAsync(
      """
      (function () {
        var sealedData = AES.SealedData.fromParts(nonce, fromHex('\(Reference.ciphertextHex)'), fromHex('\(Reference.tagHex)'));
        return Promise.all([sealedData.combined('base64'), decrypt(sealedData).then(hex)]).then(join);
      })()
      """
    )
    #expect(try result.asString() == "\(Reference.combinedBase64) \(Reference.plaintextHex)")
  }

  @Test
  func `fromParts splits the tag from the end of the ciphertext`() async throws {
    let result = try await runtime.evalAsync(
      """
      (function () {
        var ciphertextWithTag = fromHex('\(Reference.ciphertextHex)\(Reference.tagHex)');
        return Promise.all([
          AES.SealedData.fromParts(nonce, ciphertextWithTag, 16),
          AES.SealedData.fromParts(nonce, ciphertextWithTag),
          AES.SealedData.fromParts('\(Reference.nonceBase64)', ciphertextWithTag, undefined),
        ].map(partsInHex)).then(join);
      })()
      """
    )
    let parts = "\(Reference.nonceHex) \(Reference.ciphertextHex) \(Reference.tagHex)"
    #expect(try result.asString() == "\(parts) \(parts) \(parts)")
  }
}

/// AES-256-GCM output for the inputs that the JavaScript prelude declares, computed with the Node.js
/// `crypto` module.
private enum Reference {
  static let keyHex = String(repeating: "07", count: 32)
  static let keyBase64 = "BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc="
  static let nonceHex = String(repeating: "09", count: 12)
  static let nonceBase64 = "CQkJCQkJCQkJCQkJ"
  static let plaintextHex = "0102030405"
  static let plaintextBase64 = "AQIDBAU="
  static let additionalDataBase64 = "ChQeKA=="
  static let ciphertextHex = "26878790bb"
  static let ciphertextBase64 = "JoeHkLs="
  static let tagHex = "7af69a6870205f57c2df2bc1d977c750"
  static let tagBase64 = "evaaaHAgX1fC3yvB2XfHUA=="
  static let tagWithAdditionalDataHex = "4f6a0c41699350b9e07ec02a8d87257e"
  static let combinedBase64 = "CQkJCQkJCQkJCQkJJoeHkLt69ppocCBfV8LfK8HZd8dQ"

  // The same inputs with a 16-byte nonce.
  static let longNonceHex = String(repeating: "09", count: 16)
  static let longNonceCiphertextHex = "c3888e316a"
  static let longNonceTagHex = "7d3496556158de27ec652e419b235a8e"
  static let longNonceCombinedBase64 = "CQkJCQkJCQkJCQkJCQkJCcOIjjFqfTSWVWFY3ifsZS5BmyNajg=="
}
