//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import XCTest

@testable import EXUpdates

class EXUpdatesCodeSigningConfigurationTests : XCTestCase {
  private let testBody = "{\"id\":\"0754dad0-d200-d634-113c-ef1f26106028\",\"createdAt\":\"2021-11-23T00:57:14.437Z\",\"runtimeVersion\":\"1\",\"assets\":[{\"hash\":\"cb65fafb5ed456fc3ed8a726cf4087d37b875184eba96f33f6d99104e6e2266d\",\"key\":\"489ea2f19fa850b65653ab445637a181.jpg\",\"contentType\":\"image/jpeg\",\"url\":\"http://192.168.64.1:3000/api/assets?asset=updates/1/assets/489ea2f19fa850b65653ab445637a181&runtimeVersion=1&platform=android\",\"fileExtension\":\".jpg\"}],\"launchAsset\":{\"hash\":\"323ddd1968ee76d4ddbb16b04fb2c3f1b6d1ab9b637d819699fecd6fa0ffb1a8\",\"key\":\"696a70cf7035664c20ea86f67dae822b.bundle\",\"contentType\":\"application/javascript\",\"url\":\"http://192.168.64.1:3000/api/assets?asset=updates/1/bundles/android-696a70cf7035664c20ea86f67dae822b.js&runtimeVersion=1&platform=android\",\"fileExtension\":\".bundle\"}}"
  private let testCertificate = "-----BEGIN CERTIFICATE-----\nMIIDfzCCAmegAwIBAgIJLGiqnjmA9JmpMA0GCSqGSIb3DQEBCwUAMGkxFDASBgNV\nBAMTC2V4YW1wbGUub3JnMQswCQYDVQQGEwJVUzERMA8GA1UECBMIVmlyZ2luaWEx\nEzARBgNVBAcTCkJsYWNrc2J1cmcxDTALBgNVBAoTBFRlc3QxDTALBgNVBAsTBFRl\nc3QwHhcNMjExMTIyMTc0NzQzWhcNMjIxMTIyMTc0NzQzWjBpMRQwEgYDVQQDEwtl\neGFtcGxlLm9yZzELMAkGA1UEBhMCVVMxETAPBgNVBAgTCFZpcmdpbmlhMRMwEQYD\nVQQHEwpCbGFja3NidXJnMQ0wCwYDVQQKEwRUZXN0MQ0wCwYDVQQLEwRUZXN0MIIB\nIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAucg/fRwgYLxO4fDG1W/ew4Wu\nkqp2+j9mLyA18sd8noCT0eSJwxMTLJJq4biNx6kJEVSQdodN3e/qSJndz+ZHA7b1\n6Do3Ecg5oRvl3HEwaH4AkM2Lj87VjgfxPUsiSHtPd+RTbxnOy9lGupQa/j71WrAq\nzJpNmhP70vzkY4EVejn52kzRPZB3kTxkjggFrG/f18Bcf4VYxN3aLML32jih+UC0\n6fv57HNZZ3ewGSJrLcUdEgctBWiz1gzwF6YdXtEJ14eQbgHgsLsXaEQeg2ncGGxF\n/3rIhsnlWjeIIya7TS0nvqZHNKznZV9EWpZQBFVoLGGrvOdU3pTmP39qbmY0nwID\nAQABoyowKDAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwMw\nDQYJKoZIhvcNAQELBQADggEBAALcH9Jb3wq64YkNxUIa25T9umhr4uRe94ESHujM\nIRrBbbqu1p3Vs8N3whZNhcL6Djb4ob18m/aGKbF+UQBMvhn23qRCG6KKzIeDY6Os\n8tYyIwush2XeOFA7S5syPqVBI6PrRBDMCLmAJO4qTM2p0f+zyFXFuytCXOv2fA3M\n88aYVmU7NIfBTFdqNIgSt1yj7FKvd5zgoUyu7mTVdzY59xQzkzYTsnobY2XrTcvY\n6wyRqOAQ86wR8OvDjHB5y/YN2Pdg7d9jUFBCX6Ohr7W3GHrjAadKwq+kbH1aP0oB\nQTFLQQfl3gtJ3Dl/5iBQD38sCIkA54FPSsKTRw3mC4DImBQ=\n-----END CERTIFICATE-----"
  private let testSignature = "sig=\"VpuLfRlB0DizR+hRWmedPGHdx/nzNJ8OomMZNGHwqx64zrx1XezriBoItup/icOlXFrqs6FHaul4g5m41JfEWCUbhXC4x+iNk//bxozEYJHmjbcAtC6xhWbMMYQQaUjuYk7rEL987AbOWyUI2lMhrhK7LNzBaT8RGqBcpEyAqIOMuEKcK0faySnWJylc7IzxHmO8jlx5ufzio8301wej8mNW5dZd7PFOX8Dz015tIpF00VGi29ShDNFbpnalch7f92NFs08Z0g9LXndmrGjNL84Wqd4kq5awRGQObrCuDHU4uFdZjtr4ew0JaNlVuyUrrjyDloBdq0aR804vuDXacQ==\""
  
  func test_createAcceptSignatureHeader_CreatesSignatureHeaderDefaultValues() throws {
    let configuration = try EXUpdatesCodeSigningConfiguration(certificate: testCertificate, metadata: [:])
    let signatureHeader = configuration.createAcceptSignatureHeader()
    XCTAssertEqual(signatureHeader, "sig, keyid=\"root\", alg=\"rsa-v1_5-sha256\"")
  }
  
  func test_createAcceptSignatureHeader_CreatesSignatureHeaderEscapedValues() throws {
    let configuration = try EXUpdatesCodeSigningConfiguration(certificate: testCertificate,
                                                              metadata: [EXUpdatesCodeSigningMetadataFields.AlgorithmFieldKey: EXUpdatesCodeSigningAlgorithm.RSA_SHA256.rawValue,
                                                                         EXUpdatesCodeSigningMetadataFields.KeyIdFieldKey: #"test"hello\"#])
    let signatureHeader = configuration.createAcceptSignatureHeader()
    XCTAssertEqual(signatureHeader, #"sig, keyid="test\"hello\\", alg="rsa-v1_5-sha256""#)
  }
  
  func test_createAcceptSignatureHeader_CreatesSignatureHeaderValuesFromConfig() throws {
    let configuration = try EXUpdatesCodeSigningConfiguration(certificate: testCertificate,
                                                              metadata: [EXUpdatesCodeSigningMetadataFields.AlgorithmFieldKey: EXUpdatesCodeSigningAlgorithm.RSA_SHA256.rawValue,
                                                                         EXUpdatesCodeSigningMetadataFields.KeyIdFieldKey: "test"])
    let signatureHeader = configuration.createAcceptSignatureHeader()
    XCTAssertEqual(signatureHeader, "sig, keyid=\"test\", alg=\"rsa-v1_5-sha256\"")
  }
  
  func test_createAcceptSignatureHeader_ThrowsInvalidAlg() throws {
    XCTAssertThrowsError(try EXUpdatesCodeSigningConfiguration(certificate: testCertificate,
                                                                   metadata: [EXUpdatesCodeSigningMetadataFields.AlgorithmFieldKey: "fake",
                                                                              EXUpdatesCodeSigningMetadataFields.KeyIdFieldKey: "test"])) { error in
      XCTAssertEqual(error as? EXUpdatesCodeSigningAlgorithmError, EXUpdatesCodeSigningAlgorithmError.parseError)
    }
  }
  
  func test_verifyCodeSigning_Verifies() throws {
    let configuration = try EXUpdatesCodeSigningConfiguration(certificate: testCertificate, metadata: [:])
    let codeSigningInfo = try EXUpdatesSignatureHeaderInfo(signatureHeader: testSignature)
    let isValid = try configuration.verifySignatureHeaderInfo(signatureHeaderInfo: codeSigningInfo, signedData: testBody.data(using: .utf8)!)
    XCTAssertTrue(isValid.boolValue)
  }
  
  func test_verifyCodeSigning_ReturnsFalseWhenSignatureIsInvalid() throws {
    let configuration = try EXUpdatesCodeSigningConfiguration(certificate: testCertificate, metadata: [:])
    let codeSigningInfo = try EXUpdatesSignatureHeaderInfo(signatureHeader: "sig=\"aGVsbG8=\"")
    let isValid = try configuration.verifySignatureHeaderInfo(signatureHeaderInfo: codeSigningInfo, signedData: testBody.data(using: .utf8)!)
    XCTAssertFalse(isValid.boolValue)
  }
  
  func test_verifyCodeSigning_ThrowsWhenKeyDoesNotMatch() throws {
    let configuration = try EXUpdatesCodeSigningConfiguration(certificate: testCertificate,
                                                              metadata: [EXUpdatesCodeSigningMetadataFields.KeyIdFieldKey: "test"])
    let codeSigningInfo = try EXUpdatesSignatureHeaderInfo(signatureHeader: "sig=\"aGVsbG8=\", keyid=\"other\"")
    XCTAssertThrowsError(try configuration.verifySignatureHeaderInfo(signatureHeaderInfo: codeSigningInfo, signedData: testBody.data(using: .utf8)!)) { error in
      XCTAssertEqual(error as? EXUpdatesCodeSigningConfigurationError, EXUpdatesCodeSigningConfigurationError.KeyIdMismatchError)
    }
  }
}
