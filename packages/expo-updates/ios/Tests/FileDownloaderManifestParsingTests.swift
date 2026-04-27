//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Testing

@testable import EXUpdates

import EXManifests

private extension Data {
  mutating func appendStringData(_ str: String) {
    self.append(str.data(using: .utf8)!)
  }
}

@Suite("FileDownloaderManifestParsing", .serialized)
@MainActor
struct FileDownloaderManifestParsingTests {
  let database = UpdatesDatabase()
  let updatesDirectory: URL

  init() {
    let applicationSupportDir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).last!
    updatesDirectory = applicationSupportDir.appendingPathComponent("UpdatesDirectoryTests")
  }

  private func createDownloader(config: UpdatesConfig) -> FileDownloader {
    return FileDownloader(config: config, logger: UpdatesLogger(), updatesDirectory: updatesDirectory, database: database)
  }

  // MARK: - JSON body

  @Test
  func jsonBody() throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
    ])
    let downloader = createDownloader(config: config)

    let contentType = "application/json"
    let response = HTTPURLResponse(
      url: URL(string: "https://exp.host/@test/test")!,
      statusCode: 200,
      httpVersion: "HTTP/1.1",
      headerFields: ["content-type": contentType, "expo-protocol-version": "0"]
    )!

    let bodyData = CertificateFixtures.testExpoUpdatesManifestBody.data(using: .utf8)!

    var resultUpdateResponse: UpdateResponse?
    var errorOccurred: (any Error)?
    downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
      resultUpdateResponse = updateResponse
    } errorBlock: { error in
      errorOccurred = error
    }

    #expect(errorOccurred == nil)
    #expect(resultUpdateResponse?.manifestUpdateResponsePart != nil)
    #expect(resultUpdateResponse?.manifestUpdateResponsePart?.updateManifest.manifest.isVerified() == false)
  }

  // MARK: - Multipart body

  @Test
  func multipartBody() throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
    ])
    let downloader = createDownloader(config: config)

    let boundary = "blah"
    let contentType = "multipart/mixed; boundary=\(boundary)"
    let response = HTTPURLResponse(
      url: URL(string: "https://exp.host/@test/test")!,
      statusCode: 200,
      httpVersion: "HTTP/1.1",
      headerFields: ["content-type": contentType, "expo-protocol-version": "0"]
    )!

    let bodyData = Self.multipartData(
      boundary: boundary,
      manifest: CertificateFixtures.testExpoUpdatesManifestBody,
      manifestSignature: nil,
      certificateChain: nil,
      directive: CertificateFixtures.testDirectiveNoUpdateAvailable,
      directiveSignature: nil
    )

    var resultUpdateResponse: UpdateResponse?
    var errorOccurred: (any Error)?
    downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
      resultUpdateResponse = updateResponse
    } errorBlock: { error in
      errorOccurred = error
    }

    #expect(errorOccurred == nil)
    #expect(resultUpdateResponse != nil)
    #expect(resultUpdateResponse?.manifestUpdateResponsePart != nil)
    #expect(resultUpdateResponse?.manifestUpdateResponsePart?.updateManifest.manifest.isVerified() == false)
    #expect(resultUpdateResponse?.directiveUpdateResponsePart != nil)
    #expect(resultUpdateResponse?.directiveUpdateResponsePart?.updateDirective is NoUpdateAvailableUpdateDirective)
  }

  @Test
  func multipartBodyOnlyDirective() throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
    ])
    let downloader = createDownloader(config: config)

    let boundary = "blah"
    let contentType = "multipart/mixed; boundary=\(boundary)"
    let response = HTTPURLResponse(
      url: URL(string: "https://exp.host/@test/test")!,
      statusCode: 200,
      httpVersion: "HTTP/1.1",
      headerFields: ["content-type": contentType]
    )!

    let bodyData = Self.multipartData(
      boundary: boundary,
      manifest: nil,
      manifestSignature: nil,
      certificateChain: nil,
      directive: CertificateFixtures.testDirectiveNoUpdateAvailable,
      directiveSignature: nil
    )

    var resultUpdateResponse: UpdateResponse?
    var errorOccurred: (any Error)?
    downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
      resultUpdateResponse = updateResponse
    } errorBlock: { error in
      errorOccurred = error
    }

    #expect(errorOccurred == nil)
    #expect(resultUpdateResponse != nil)
    #expect(resultUpdateResponse?.manifestUpdateResponsePart == nil)
    #expect(resultUpdateResponse?.directiveUpdateResponsePart != nil)
    #expect(resultUpdateResponse?.directiveUpdateResponsePart?.updateDirective is NoUpdateAvailableUpdateDirective)
  }

  @Test
  func multipartBodyOnlyDirectiveV0CompatibilityMode() throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
      UpdatesConfig.EXUpdatesConfigEnableExpoUpdatesProtocolV0CompatibilityModeKey: true
    ])
    let downloader = createDownloader(config: config)

    let boundary = "blah"
    let contentType = "multipart/mixed; boundary=\(boundary)"
    let response = HTTPURLResponse(
      url: URL(string: "https://exp.host/@test/test")!,
      statusCode: 200,
      httpVersion: "HTTP/1.1",
      headerFields: ["content-type": contentType]
    )!

    let bodyData = Self.multipartData(
      boundary: boundary,
      manifest: nil,
      manifestSignature: nil,
      certificateChain: nil,
      directive: CertificateFixtures.testDirectiveNoUpdateAvailable,
      directiveSignature: nil
    )

    var resultUpdateResponse: UpdateResponse?
    var errorOccurred: (any Error)?
    downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
      resultUpdateResponse = updateResponse
    } errorBlock: { error in
      errorOccurred = error
    }

    #expect(errorOccurred?.localizedDescription == "Multipart response missing manifest part. Manifest is required in version 0 of the expo-updates protocol. This may be due to the response being for a different protocol version.")
    #expect(resultUpdateResponse == nil)
  }

  @Test
  func multipartBodyNoRelevantParts() throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
    ])
    let downloader = createDownloader(config: config)

    let boundary = "blah"
    let contentType = "multipart/mixed; boundary=\(boundary)"
    let response = HTTPURLResponse(
      url: URL(string: "https://exp.host/@test/test")!,
      statusCode: 200,
      httpVersion: "HTTP/1.1",
      headerFields: ["content-type": contentType]
    )!

    let bodyData = Self.multipartData(
      boundary: boundary,
      manifest: nil,
      manifestSignature: nil,
      certificateChain: nil,
      directive: nil,
      directiveSignature: nil,
      extraneous: ""
    )

    var resultUpdateResponse: UpdateResponse?
    var errorOccurred: (any Error)?
    downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
      resultUpdateResponse = updateResponse
    } errorBlock: { error in
      errorOccurred = error
    }

    #expect(errorOccurred == nil)
    #expect(resultUpdateResponse != nil)
    #expect(resultUpdateResponse?.manifestUpdateResponsePart == nil)
    #expect(resultUpdateResponse?.directiveUpdateResponsePart == nil)
  }

  @Test
  func multipartBodyEmpty() throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
    ])
    let downloader = createDownloader(config: config)

    let boundary = "blah"
    let contentType = "multipart/mixed; boundary=\(boundary)"
    let response = HTTPURLResponse(
      url: URL(string: "https://exp.host/@test/test")!,
      statusCode: 200,
      httpVersion: "HTTP/1.1",
      headerFields: ["content-type": contentType]
    )!

    let bodyData = Data()

    var resultUpdateResponse: UpdateResponse?
    var errorOccurred: (any Error)?
    downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
      resultUpdateResponse = updateResponse
    } errorBlock: { error in
      errorOccurred = error
    }

    #expect(errorOccurred == nil)
    #expect(resultUpdateResponse != nil)
    #expect(resultUpdateResponse?.manifestUpdateResponsePart == nil)
    #expect(resultUpdateResponse?.directiveUpdateResponsePart == nil)
  }

  // MARK: - Nil / 204 responses

  @Test
  func nilBodyProtocol1() throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
    ])
    let downloader = createDownloader(config: config)

    let response = HTTPURLResponse(
      url: URL(string: "https://exp.host/@test/test")!,
      statusCode: 200,
      httpVersion: "HTTP/1.1",
      headerFields: ["expo-protocol-version": "1"]
    )!

    var resultUpdateResponse: UpdateResponse?
    var errorOccurred: (any Error)?
    downloader.parseManifestResponse(response, withData: nil, database: database) { updateResponse in
      resultUpdateResponse = updateResponse
    } errorBlock: { error in
      errorOccurred = error
    }

    #expect(errorOccurred == nil)
    #expect(resultUpdateResponse != nil)
    #expect(resultUpdateResponse?.manifestUpdateResponsePart == nil)
    #expect(resultUpdateResponse?.directiveUpdateResponsePart == nil)
  }

  @Test
  func response204Protocol1() throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
    ])
    let downloader = createDownloader(config: config)

    let response = HTTPURLResponse(
      url: URL(string: "https://exp.host/@test/test")!,
      statusCode: 204,
      httpVersion: "HTTP/1.1",
      headerFields: ["expo-protocol-version": "1"]
    )!

    var resultUpdateResponse: UpdateResponse?
    var errorOccurred: (any Error)?
    downloader.parseManifestResponse(response, withData: nil, database: database) { updateResponse in
      resultUpdateResponse = updateResponse
    } errorBlock: { error in
      errorOccurred = error
    }

    #expect(errorOccurred == nil)
    #expect(resultUpdateResponse != nil)
    #expect(resultUpdateResponse?.manifestUpdateResponsePart == nil)
    #expect(resultUpdateResponse?.directiveUpdateResponsePart == nil)
  }

  @Test
  func response204NoProtocol() throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
    ])
    let downloader = createDownloader(config: config)

    let response = HTTPURLResponse(
      url: URL(string: "https://exp.host/@test/test")!,
      statusCode: 204,
      httpVersion: "HTTP/1.1",
      headerFields: [:]
    )!

    var resultUpdateResponse: UpdateResponse?
    var errorOccurred: (any Error)?
    downloader.parseManifestResponse(response, withData: nil, database: database) { updateResponse in
      resultUpdateResponse = updateResponse
    } errorBlock: { error in
      errorOccurred = error
    }

    #expect(errorOccurred?.localizedDescription == "Missing body in remote update")
    #expect(resultUpdateResponse == nil)
  }

  // MARK: - Signed responses

  @Test
  func jsonBodySigned() throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
      UpdatesConfig.EXUpdatesConfigCodeSigningCertificateKey: getTestCertificate(.test),
      UpdatesConfig.EXUpdatesConfigCodeSigningMetadataKey: [:],
    ])
    let downloader = createDownloader(config: config)
    let response = HTTPURLResponse(
      url: URL(string: "https://exp.host/@test/test")!,
      statusCode: 200,
      httpVersion: "HTTP/1.1",
      headerFields: [
        "expo-protocol-version": "0",
        "expo-sfv-version": "0",
        "content-type": "application/json",
        "expo-signature": CertificateFixtures.testExpoUpdatesManifestBodySignature,
      ]
    )!

    let bodyData = CertificateFixtures.testExpoUpdatesManifestBody.data(using: .utf8)!

    var resultUpdateResponse: UpdateResponse?
    var errorOccurred: (any Error)?
    downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
      resultUpdateResponse = updateResponse
    } errorBlock: { error in
      errorOccurred = error
    }

    #expect(errorOccurred == nil)
    #expect(resultUpdateResponse?.manifestUpdateResponsePart != nil)
    #expect(resultUpdateResponse?.manifestUpdateResponsePart?.updateManifest.manifest.isVerified() == true)
  }

  @Test
  func multipartBodySigned() throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
      UpdatesConfig.EXUpdatesConfigCodeSigningCertificateKey: getTestCertificate(.test),
      UpdatesConfig.EXUpdatesConfigCodeSigningMetadataKey: [:],
    ])
    let downloader = createDownloader(config: config)

    let boundary = "blah"
    let response = HTTPURLResponse(
      url: URL(string: "https://exp.host/@test/test")!,
      statusCode: 200,
      httpVersion: "HTTP/1.1",
      headerFields: [
        "expo-protocol-version": "0",
        "expo-sfv-version": "0",
        "content-type": "multipart/mixed; boundary=\(boundary)"
      ]
    )!

    let bodyData = Self.multipartData(
      boundary: boundary,
      manifest: CertificateFixtures.testExpoUpdatesManifestBody,
      manifestSignature: CertificateFixtures.testExpoUpdatesManifestBodySignature,
      certificateChain: nil,
      directive: CertificateFixtures.testDirectiveNoUpdateAvailable,
      directiveSignature: CertificateFixtures.testDirectiveNoUpdateAvailableSignature
    )

    var resultUpdateResponse: UpdateResponse?
    var errorOccurred: (any Error)?
    downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
      resultUpdateResponse = updateResponse
    } errorBlock: { error in
      errorOccurred = error
    }

    #expect(errorOccurred == nil)
    #expect(resultUpdateResponse != nil)
    #expect(resultUpdateResponse?.manifestUpdateResponsePart != nil)
    #expect(resultUpdateResponse?.manifestUpdateResponsePart?.updateManifest.manifest.isVerified() == true)
    #expect(resultUpdateResponse?.directiveUpdateResponsePart != nil)
    #expect(resultUpdateResponse?.directiveUpdateResponsePart?.updateDirective is NoUpdateAvailableUpdateDirective)
  }

  @Test
  func jsonBodyExpectsSignedReceivesUnsigned() throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
      UpdatesConfig.EXUpdatesConfigCodeSigningCertificateKey: getTestCertificate(.test),
      UpdatesConfig.EXUpdatesConfigCodeSigningMetadataKey: [:],
    ])
    let downloader = createDownloader(config: config)
    let response = HTTPURLResponse(
      url: URL(string: "https://exp.host/@test/test")!,
      statusCode: 200,
      httpVersion: "HTTP/1.1",
      headerFields: [
        "expo-protocol-version": "0",
        "expo-sfv-version": "0",
        "content-type": "application/json",
      ]
    )!

    let bodyData = CertificateFixtures.testExpoUpdatesManifestBody.data(using: .utf8)!

    var resultUpdateResponse: UpdateResponse?
    var errorOccurred: (any Error)?
    downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
      resultUpdateResponse = updateResponse
    } errorBlock: { error in
      errorOccurred = error
    }

    #expect(errorOccurred?.localizedDescription == "Code signature validation failed: No expo-signature header specified")
    #expect(resultUpdateResponse == nil)
  }

  // MARK: - Certificate chain

  @Test
  func multipartBodySignedCertificateParticularExperience() throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
      UpdatesConfig.EXUpdatesConfigCodeSigningCertificateKey: getTestCertificate(.chainRoot),
      UpdatesConfig.EXUpdatesConfigCodeSigningMetadataKey: [
        "keyid": "ca-root",
      ],
      UpdatesConfig.EXUpdatesConfigCodeSigningIncludeManifestResponseCertificateChainKey: true
    ])
    let downloader = createDownloader(config: config)

    let boundary = "blah"
    let response = HTTPURLResponse(
      url: URL(string: "https://exp.host/@test/test")!,
      statusCode: 200,
      httpVersion: "HTTP/1.1",
      headerFields: [
        "expo-protocol-version": "0",
        "expo-sfv-version": "0",
        "content-type": "multipart/mixed; boundary=\(boundary)"
      ]
    )!

    let bodyData = Self.multipartData(
      boundary: boundary,
      manifest: CertificateFixtures.testExpoUpdatesManifestBody,
      manifestSignature: CertificateFixtures.testExpoUpdatesManifestBodyValidChainLeafSignature,
      certificateChain: "\(getTestCertificate(.chainLeaf))\(getTestCertificate(.chainIntermediate))",
      directive: CertificateFixtures.testDirectiveNoUpdateAvailable,
      directiveSignature: CertificateFixtures.testDirectiveNoUpdateAvailableValidChainLeafSignature
    )

    var resultUpdateResponse: UpdateResponse?
    var errorOccurred: (any Error)?
    downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
      resultUpdateResponse = updateResponse
    } errorBlock: { error in
      errorOccurred = error
    }

    #expect(errorOccurred == nil)
    #expect(resultUpdateResponse != nil)
    #expect(resultUpdateResponse?.manifestUpdateResponsePart?.updateManifest.manifest.isVerified() == true)
    #expect(resultUpdateResponse?.directiveUpdateResponsePart != nil)
    #expect(resultUpdateResponse?.directiveUpdateResponsePart?.updateDirective is NoUpdateAvailableUpdateDirective)
  }

  @Test
  func multipartBodySignedCertificateIncorrectExperienceInManifest() throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
      UpdatesConfig.EXUpdatesConfigCodeSigningCertificateKey: getTestCertificate(.chainRoot),
      UpdatesConfig.EXUpdatesConfigCodeSigningMetadataKey: [
        "keyid": "ca-root",
      ],
      UpdatesConfig.EXUpdatesConfigCodeSigningIncludeManifestResponseCertificateChainKey: true
    ])
    let downloader = createDownloader(config: config)

    let boundary = "blah"
    let response = HTTPURLResponse(
      url: URL(string: "https://exp.host/@test/test")!,
      statusCode: 200,
      httpVersion: "HTTP/1.1",
      headerFields: [
        "expo-protocol-version": "0",
        "expo-sfv-version": "0",
        "content-type": "multipart/mixed; boundary=\(boundary)"
      ]
    )!

    let bodyData = Self.multipartData(
      boundary: boundary,
      manifest: CertificateFixtures.testExpoUpdatesManifestBodyIncorrectProjectId,
      manifestSignature: CertificateFixtures.testExpoUpdatesManifestBodyValidChainLeafSignatureIncorrectProjectId,
      certificateChain: "\(getTestCertificate(.chainLeaf))\(getTestCertificate(.chainIntermediate))",
      directive: nil,
      directiveSignature: nil
    )

    var resultUpdateResponse: UpdateResponse?
    var errorOccurred: (any Error)?
    downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
      resultUpdateResponse = updateResponse
    } errorBlock: { error in
      errorOccurred = error
    }

    #expect(errorOccurred?.localizedDescription == "Code signing certificate project ID or scope key does not match project ID or scope key in response part")
    #expect(resultUpdateResponse == nil)
  }

  @Test
  func multipartBodySignedCertificateIncorrectExperienceInDirective() throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
      UpdatesConfig.EXUpdatesConfigCodeSigningCertificateKey: getTestCertificate(.chainRoot),
      UpdatesConfig.EXUpdatesConfigCodeSigningMetadataKey: [
        "keyid": "ca-root",
      ],
      UpdatesConfig.EXUpdatesConfigCodeSigningIncludeManifestResponseCertificateChainKey: true
    ])
    let downloader = createDownloader(config: config)

    let boundary = "blah"
    let response = HTTPURLResponse(
      url: URL(string: "https://exp.host/@test/test")!,
      statusCode: 200,
      httpVersion: "HTTP/1.1",
      headerFields: [
        "expo-protocol-version": "0",
        "expo-sfv-version": "0",
        "content-type": "multipart/mixed; boundary=\(boundary)"
      ]
    )!

    let bodyData = Self.multipartData(
      boundary: boundary,
      manifest: nil,
      manifestSignature: nil,
      certificateChain: "\(getTestCertificate(.chainLeaf))\(getTestCertificate(.chainIntermediate))",
      directive: CertificateFixtures.testDirectiveNoUpdateAvailableIncorrectProjectId,
      directiveSignature: CertificateFixtures.testDirectiveNoUpdateAvailableValidChainLeafSignatureIncorrectProjectId
    )

    var resultUpdateResponse: UpdateResponse?
    var errorOccurred: (any Error)?
    downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
      resultUpdateResponse = updateResponse
    } errorBlock: { error in
      errorOccurred = error
    }

    #expect(errorOccurred?.localizedDescription == "Code signing certificate project ID or scope key does not match project ID or scope key in response part")
    #expect(resultUpdateResponse == nil)
  }

  // MARK: - Allow unsigned

  @Test
  func jsonBodySignedUnsignedRequestManifestSignatureOptional() throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
      UpdatesConfig.EXUpdatesConfigCodeSigningCertificateKey: getTestCertificate(.test),
      UpdatesConfig.EXUpdatesConfigCodeSigningMetadataKey: [:],
      UpdatesConfig.EXUpdatesConfigCodeSigningAllowUnsignedManifestsKey: true
    ])
    let downloader = createDownloader(config: config)
    let response = HTTPURLResponse(
      url: URL(string: "https://exp.host/@test/test")!,
      statusCode: 200,
      httpVersion: "HTTP/1.1",
      headerFields: [
        "expo-protocol-version": "0",
        "expo-sfv-version": "0",
        "content-type": "application/json",
      ]
    )!

    let bodyData = CertificateFixtures.testExpoUpdatesManifestBody.data(using: .utf8)!

    var resultUpdateResponse: UpdateResponse?
    var errorOccurred: (any Error)?
    downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
      resultUpdateResponse = updateResponse
    } errorBlock: { error in
      errorOccurred = error
    }

    #expect(errorOccurred == nil)
    #expect(resultUpdateResponse != nil)
  }

  // MARK: - Helpers

  private static func multipartData(
    boundary: String,
    manifest: String?,
    manifestSignature: String?,
    certificateChain: String?,
    directive: String?,
    directiveSignature: String?,
    extraneous: String? = nil
  ) -> Data {
    var body = Data()

    func appendPart(name: String, contentType: String, bodyString: String, signature: String? = nil) {
      body.appendStringData("--\(boundary)\r\n")
      body.appendStringData("Content-Type: application/\(contentType)\r\n")
      if let signature = signature {
        body.appendStringData("expo-signature: \(signature)\r\n")
      }
      body.appendStringData("Content-Disposition: inline; name=\"\(name)\"\r\n\r\n")
      body.appendStringData(bodyString)
      body.appendStringData("\r\n")
    }

    if let manifest = manifest {
      appendPart(name: "manifest", contentType: "json", bodyString: manifest, signature: manifestSignature)
    }
    if let certificateChain = certificateChain {
      appendPart(name: "certificate_chain", contentType: "x-pem-file", bodyString: certificateChain)
    }
    if let directive = directive {
      appendPart(name: "directive", contentType: "json", bodyString: directive, signature: directiveSignature)
    }
    if let extraneous = extraneous {
      appendPart(name: "extraneous", contentType: "text", bodyString: extraneous)
    }
    body.appendStringData("--\(boundary)--\r\n")
    return body
  }
}
