//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

import EXManifests

private extension Data {
  mutating func appendStringData(_ str: String) {
    self.append(str.data(using: .utf8)!)
  }
}

class FileDownloaderManifestParsingSpec : ExpoSpec {
  override class func spec() {
    let database = UpdatesDatabase()
    
    describe("manifest parsing") {
      it("JSON body") {
        let config = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
        ])
        let downloader = FileDownloader(config: config)
        let contentType = "application/json"
        let response = HTTPURLResponse(
          url: URL(string: "https://exp.host/@test/test")!,
          statusCode: 200,
          httpVersion: "HTTP/1.1",
          headerFields: ["content-type": contentType, "expo-protocol-version": "0"]
        )!
        
        let bodyData = CertificateFixtures.testExpoUpdatesManifestBody.data(using: .utf8)!

        var resultUpdateResponse: UpdateResponse? = nil
        var errorOccurred: (any Error)? = nil
        downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
          resultUpdateResponse = updateResponse
        } errorBlock: { error in
          errorOccurred = error
        }
        
        expect(errorOccurred).to(beNil())
        expect(resultUpdateResponse?.manifestUpdateResponsePart).notTo(beNil())
        expect(resultUpdateResponse?.manifestUpdateResponsePart?.updateManifest.manifest.isVerified()) == false
      }
      
      it("multipart body") {
        let config = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
        ])
        let downloader = FileDownloader(config: config)
        
        let boundary = "blah"
        let contentType = "multipart/mixed; boundary=\(boundary)"
        let response = HTTPURLResponse(
          url: URL(string: "https://exp.host/@test/test")!,
          statusCode: 200,
          httpVersion: "HTTP/1.1",
          headerFields: ["content-type": contentType, "expo-protocol-version": "0"]
        )!
        
        let bodyData = FileDownloaderManifestParsingSpec.mutlipartData(
          boundary: boundary,
          manifest: CertificateFixtures.testExpoUpdatesManifestBody,
          manifestSignature: nil,
          certificateChain: nil,
          directive: CertificateFixtures.testDirectiveNoUpdateAvailable,
          directiveSignature: nil
        )
        
        var resultUpdateResponse: UpdateResponse? = nil
        var errorOccurred: (any Error)? = nil
        downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
          resultUpdateResponse = updateResponse
        } errorBlock: { error in
          errorOccurred = error
        }
        
        expect(errorOccurred).to(beNil())
        expect(resultUpdateResponse).notTo(beNil())
        expect(resultUpdateResponse?.manifestUpdateResponsePart).notTo(beNil())
        expect(resultUpdateResponse?.manifestUpdateResponsePart?.updateManifest.manifest.isVerified()) == false
        
        expect(resultUpdateResponse?.directiveUpdateResponsePart).notTo(beNil())
        expect(resultUpdateResponse?.directiveUpdateResponsePart?.updateDirective is NoUpdateAvailableUpdateDirective) == true
      }
      
      it("multipart body only directive") {
        let config = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
        ])
        let downloader = FileDownloader(config: config)
        
        let boundary = "blah"
        let contentType = "multipart/mixed; boundary=\(boundary)"
        let response = HTTPURLResponse(
          url: URL(string: "https://exp.host/@test/test")!,
          statusCode: 200,
          httpVersion: "HTTP/1.1",
          headerFields: ["content-type": contentType]
        )!
        
        let bodyData = FileDownloaderManifestParsingSpec.mutlipartData(
          boundary: boundary,
          manifest: nil,
          manifestSignature: nil,
          certificateChain: nil,
          directive: CertificateFixtures.testDirectiveNoUpdateAvailable,
          directiveSignature: nil
        )
        
        var resultUpdateResponse: UpdateResponse? = nil
        var errorOccurred: (any Error)? = nil
        downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
          resultUpdateResponse = updateResponse
        } errorBlock: { error in
          errorOccurred = error
        }
        
        expect(errorOccurred).to(beNil())
        expect(resultUpdateResponse).notTo(beNil())
        
        expect(resultUpdateResponse?.manifestUpdateResponsePart).to(beNil())
        
        expect(resultUpdateResponse?.directiveUpdateResponsePart).notTo(beNil())
        expect(resultUpdateResponse?.directiveUpdateResponsePart?.updateDirective is NoUpdateAvailableUpdateDirective) == true
      }
      
      it("multipart body only directive v0 compatibility mode") {
        let config = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
          UpdatesConfig.EXUpdatesConfigEnableExpoUpdatesProtocolV0CompatibilityModeKey: true
        ])
        let downloader = FileDownloader(config: config)
        
        let boundary = "blah"
        let contentType = "multipart/mixed; boundary=\(boundary)"
        let response = HTTPURLResponse(
          url: URL(string: "https://exp.host/@test/test")!,
          statusCode: 200,
          httpVersion: "HTTP/1.1",
          headerFields: ["content-type": contentType]
        )!
        
        let bodyData = FileDownloaderManifestParsingSpec.mutlipartData(
          boundary: boundary,
          manifest: nil,
          manifestSignature: nil,
          certificateChain: nil,
          directive: CertificateFixtures.testDirectiveNoUpdateAvailable,
          directiveSignature: nil
        )
        
        var resultUpdateResponse: UpdateResponse? = nil
        var errorOccurred: (any Error)? = nil
        downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
          resultUpdateResponse = updateResponse
        } errorBlock: { error in
          errorOccurred = error
        }
        
        expect(errorOccurred?.localizedDescription) == "Multipart response missing manifest part. Manifest is required in version 0 of the expo-updates protocol. This may be due to the response being for a different protocol version."
        expect(resultUpdateResponse).to(beNil())
      }
      
      it("multipart body no relevant parts") {
        let config = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
        ])
        let downloader = FileDownloader(config: config)
        
        let boundary = "blah"
        let contentType = "multipart/mixed; boundary=\(boundary)"
        let response = HTTPURLResponse(
          url: URL(string: "https://exp.host/@test/test")!,
          statusCode: 200,
          httpVersion: "HTTP/1.1",
          headerFields: ["content-type": contentType]
        )!
        
        let bodyData = FileDownloaderManifestParsingSpec.mutlipartData(
          boundary: boundary,
          manifest: nil,
          manifestSignature: nil,
          certificateChain: nil,
          directive: nil,
          directiveSignature: nil,
          extraneous: ""
        )
        
        var resultUpdateResponse: UpdateResponse? = nil
        var errorOccurred: (any Error)? = nil
        downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
          resultUpdateResponse = updateResponse
        } errorBlock: { error in
          errorOccurred = error
        }
        
        expect(errorOccurred).to(beNil())
        expect(resultUpdateResponse).notTo(beNil())
        
        expect(resultUpdateResponse?.manifestUpdateResponsePart).to(beNil())
        expect(resultUpdateResponse?.directiveUpdateResponsePart).to(beNil())
      }

      it("multipart body empty") {
        let config = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
        ])
        let downloader = FileDownloader(config: config)

        let boundary = "blah"
        let contentType = "multipart/mixed; boundary=\(boundary)"
        let response = HTTPURLResponse(
          url: URL(string: "https://exp.host/@test/test")!,
          statusCode: 200,
          httpVersion: "HTTP/1.1",
          headerFields: ["content-type": contentType]
        )!

        let bodyData = Data()

        var resultUpdateResponse: UpdateResponse? = nil
        var errorOccurred: (any Error)? = nil
        downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
          resultUpdateResponse = updateResponse
        } errorBlock: { error in
          errorOccurred = error
        }

        expect(errorOccurred).to(beNil())
        expect(resultUpdateResponse).notTo(beNil())

        expect(resultUpdateResponse?.manifestUpdateResponsePart).to(beNil())
        expect(resultUpdateResponse?.directiveUpdateResponsePart).to(beNil())
      }

      it("nil body protocol 1") {
        let config = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
        ])
        let downloader = FileDownloader(config: config)

        let boundary = "blah"
        let contentType = "multipart/mixed; boundary=\(boundary)"
        let response = HTTPURLResponse(
          url: URL(string: "https://exp.host/@test/test")!,
          statusCode: 200,
          httpVersion: "HTTP/1.1",
          headerFields: ["expo-protocol-version": "1"]
        )!

        let bodyData: Data? = nil

        var resultUpdateResponse: UpdateResponse? = nil
        var errorOccurred: (any Error)? = nil
        downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
          resultUpdateResponse = updateResponse
        } errorBlock: { error in
          errorOccurred = error
        }

        expect(errorOccurred).to(beNil())
        expect(resultUpdateResponse).notTo(beNil())

        expect(resultUpdateResponse?.manifestUpdateResponsePart).to(beNil())
        expect(resultUpdateResponse?.directiveUpdateResponsePart).to(beNil())
      }

      it("204 response protocol 1") {
        let config = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
        ])
        let downloader = FileDownloader(config: config)

        let response = HTTPURLResponse(
          url: URL(string: "https://exp.host/@test/test")!,
          statusCode: 204,
          httpVersion: "HTTP/1.1",
          headerFields: ["expo-protocol-version": "1"]
        )!

        let bodyData: Data? = nil

        var resultUpdateResponse: UpdateResponse? = nil
        var errorOccurred: (any Error)? = nil
        downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
          resultUpdateResponse = updateResponse
        } errorBlock: { error in
          errorOccurred = error
        }

        expect(errorOccurred).to(beNil())
        expect(resultUpdateResponse).notTo(beNil())

        expect(resultUpdateResponse?.manifestUpdateResponsePart).to(beNil())
        expect(resultUpdateResponse?.directiveUpdateResponsePart).to(beNil())
      }

      it("204 response no protocol") {
        let config = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
        ])
        let downloader = FileDownloader(config: config)

        let response = HTTPURLResponse(
          url: URL(string: "https://exp.host/@test/test")!,
          statusCode: 204,
          httpVersion: "HTTP/1.1",
          headerFields: [:]
        )!

        let bodyData: Data? = nil

        var resultUpdateResponse: UpdateResponse? = nil
        var errorOccurred: (any Error)? = nil
        downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
          resultUpdateResponse = updateResponse
        } errorBlock: { error in
          errorOccurred = error
        }

        expect(errorOccurred?.localizedDescription) == "Missing body in remote update"
        expect(resultUpdateResponse).to(beNil())
      }
      
      it("json body signed") {
        let config = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
          UpdatesConfig.EXUpdatesConfigCodeSigningCertificateKey: getTestCertificate(.test),
          UpdatesConfig.EXUpdatesConfigCodeSigningMetadataKey: [:],
        ])
        let downloader = FileDownloader(config: config)
        let contentType = "application/json"
        let response = HTTPURLResponse(
          url: URL(string: "https://exp.host/@test/test")!,
          statusCode: 200,
          httpVersion: "HTTP/1.1",
          headerFields: [
            "expo-protocol-version": "0",
            "expo-sfv-version": "0",
            "content-type": contentType,
            "expo-signature": CertificateFixtures.testExpoUpdatesManifestBodySignature,
          ]
        )!
        
        let bodyData = CertificateFixtures.testExpoUpdatesManifestBody.data(using: .utf8)!
        
        var resultUpdateResponse: UpdateResponse? = nil
        var errorOccurred: (any Error)? = nil
        downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
          resultUpdateResponse = updateResponse
        } errorBlock: { error in
          errorOccurred = error
        }
        
        expect(errorOccurred).to(beNil())
        expect(resultUpdateResponse?.manifestUpdateResponsePart).notTo(beNil())
        expect(resultUpdateResponse?.manifestUpdateResponsePart?.updateManifest.manifest.isVerified()) == true
      }
      
      it("multipart body signed") {
        let config = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
          UpdatesConfig.EXUpdatesConfigCodeSigningCertificateKey: getTestCertificate(.test),
          UpdatesConfig.EXUpdatesConfigCodeSigningMetadataKey: [:],
        ])
        let downloader = FileDownloader(config: config)
        
        let boundary = "blah"
        let contentType = "multipart/mixed; boundary=\(boundary)"
        let response = HTTPURLResponse(
          url: URL(string: "https://exp.host/@test/test")!,
          statusCode: 200,
          httpVersion: "HTTP/1.1",
          headerFields: [
            "expo-protocol-version": "0",
            "expo-sfv-version": "0",
            "content-type": contentType
          ]
        )!
        
        let bodyData = FileDownloaderManifestParsingSpec.mutlipartData(
          boundary: boundary,
          manifest: CertificateFixtures.testExpoUpdatesManifestBody,
          manifestSignature: CertificateFixtures.testExpoUpdatesManifestBodySignature,
          certificateChain: nil,
          directive: CertificateFixtures.testDirectiveNoUpdateAvailable,
          directiveSignature: CertificateFixtures.testDirectiveNoUpdateAvailableSignature
        )
        
        var resultUpdateResponse: UpdateResponse? = nil
        var errorOccurred: (any Error)? = nil
        downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
          resultUpdateResponse = updateResponse
        } errorBlock: { error in
          errorOccurred = error
        }
        
        expect(errorOccurred).to(beNil())
        expect(resultUpdateResponse).notTo(beNil())
        expect(resultUpdateResponse).notTo(beNil())
        expect(resultUpdateResponse?.manifestUpdateResponsePart).notTo(beNil())
        expect(resultUpdateResponse?.manifestUpdateResponsePart?.updateManifest.manifest.isVerified()) == true
        
        expect(resultUpdateResponse?.directiveUpdateResponsePart).notTo(beNil())
        expect(resultUpdateResponse?.directiveUpdateResponsePart?.updateDirective is NoUpdateAvailableUpdateDirective) == true
      }
      
      it("json body expects signed receives unsigned") {
        let config = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
          UpdatesConfig.EXUpdatesConfigCodeSigningCertificateKey: getTestCertificate(.test),
          UpdatesConfig.EXUpdatesConfigCodeSigningMetadataKey: [:],
        ])
        let downloader = FileDownloader(config: config)
        let contentType = "application/json"
        let response = HTTPURLResponse(
          url: URL(string: "https://exp.host/@test/test")!,
          statusCode: 200,
          httpVersion: "HTTP/1.1",
          headerFields: [
            "expo-protocol-version": "0",
            "expo-sfv-version": "0",
            "content-type": contentType,
          ]
        )!
        
        let bodyData = CertificateFixtures.testExpoUpdatesManifestBody.data(using: .utf8)!
        
        var resultUpdateResponse: UpdateResponse? = nil
        var errorOccurred: (any Error)? = nil
        downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
          resultUpdateResponse = updateResponse
        } errorBlock: { error in
          errorOccurred = error
        }
        
        expect(errorOccurred?.localizedDescription) == "Code signature validation failed: No expo-signature header specified"
        expect(resultUpdateResponse).to(beNil())
      }
      
      it("multipart body signed certificate particular experience") {
        let config = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
          UpdatesConfig.EXUpdatesConfigCodeSigningCertificateKey: getTestCertificate(.chainRoot),
          UpdatesConfig.EXUpdatesConfigCodeSigningMetadataKey: [
            "keyid": "ca-root",
          ],
          UpdatesConfig.EXUpdatesConfigCodeSigningIncludeManifestResponseCertificateChainKey: true
        ])
        let downloader = FileDownloader(config: config)
        
        let boundary = "blah"
        let contentType = "multipart/mixed; boundary=\(boundary)"
        let response = HTTPURLResponse(
          url: URL(string: "https://exp.host/@test/test")!,
          statusCode: 200,
          httpVersion: "HTTP/1.1",
          headerFields: [
            "expo-protocol-version": "0",
            "expo-sfv-version": "0",
            "content-type": contentType
          ]
        )!
        
        let bodyData = FileDownloaderManifestParsingSpec.mutlipartData(
          boundary: boundary,
          manifest: CertificateFixtures.testExpoUpdatesManifestBody,
          manifestSignature: CertificateFixtures.testExpoUpdatesManifestBodyValidChainLeafSignature,
          certificateChain: "\(getTestCertificate(.chainLeaf))\(getTestCertificate(.chainIntermediate))",
          directive: CertificateFixtures.testDirectiveNoUpdateAvailable,
          directiveSignature: CertificateFixtures.testDirectiveNoUpdateAvailableValidChainLeafSignature
        )
        
        var resultUpdateResponse: UpdateResponse? = nil
        var errorOccurred: (any Error)? = nil
        downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
          resultUpdateResponse = updateResponse
        } errorBlock: { error in
          errorOccurred = error
        }
        
        expect(errorOccurred).to(beNil())
        expect(resultUpdateResponse).notTo(beNil())
        expect(resultUpdateResponse?.manifestUpdateResponsePart?.updateManifest.manifest.isVerified()) == true
        
        expect(resultUpdateResponse?.directiveUpdateResponsePart).notTo(beNil())
        expect(resultUpdateResponse?.directiveUpdateResponsePart?.updateDirective is NoUpdateAvailableUpdateDirective) == true
      }
      
      it("multipart body signed certificate particular experience incorrect experience in manifest") {
        let config = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
          UpdatesConfig.EXUpdatesConfigCodeSigningCertificateKey: getTestCertificate(.chainRoot),
          UpdatesConfig.EXUpdatesConfigCodeSigningMetadataKey: [
            "keyid": "ca-root",
          ],
          UpdatesConfig.EXUpdatesConfigCodeSigningIncludeManifestResponseCertificateChainKey: true
        ])
        let downloader = FileDownloader(config: config)
        
        let boundary = "blah"
        let contentType = "multipart/mixed; boundary=\(boundary)"
        let response = HTTPURLResponse(
          url: URL(string: "https://exp.host/@test/test")!,
          statusCode: 200,
          httpVersion: "HTTP/1.1",
          headerFields: [
            "expo-protocol-version": "0",
            "expo-sfv-version": "0",
            "content-type": contentType
          ]
        )!
        
        let bodyData = FileDownloaderManifestParsingSpec.mutlipartData(
          boundary: boundary,
          manifest: CertificateFixtures.testExpoUpdatesManifestBodyIncorrectProjectId,
          manifestSignature: CertificateFixtures.testExpoUpdatesManifestBodyValidChainLeafSignatureIncorrectProjectId,
          certificateChain: "\(getTestCertificate(.chainLeaf))\(getTestCertificate(.chainIntermediate))",
          directive: nil,
          directiveSignature: nil
        )
        
        var resultUpdateResponse: UpdateResponse? = nil
        var errorOccurred: (any Error)? = nil
        downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
          resultUpdateResponse = updateResponse
        } errorBlock: { error in
          errorOccurred = error
        }
        
        expect(errorOccurred?.localizedDescription) == "Code signing certificate project ID or scope key does not match project ID or scope key in response part"
        expect(resultUpdateResponse).to(beNil())
      }
      
      it("multipart body signed certificate particular experience incorrect experience in directive") {
        let config = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
          UpdatesConfig.EXUpdatesConfigCodeSigningCertificateKey: getTestCertificate(.chainRoot),
          UpdatesConfig.EXUpdatesConfigCodeSigningMetadataKey: [
            "keyid": "ca-root",
          ],
          UpdatesConfig.EXUpdatesConfigCodeSigningIncludeManifestResponseCertificateChainKey: true
        ])
        let downloader = FileDownloader(config: config)
        
        let boundary = "blah"
        let contentType = "multipart/mixed; boundary=\(boundary)"
        let response = HTTPURLResponse(
          url: URL(string: "https://exp.host/@test/test")!,
          statusCode: 200,
          httpVersion: "HTTP/1.1",
          headerFields: [
            "expo-protocol-version": "0",
            "expo-sfv-version": "0",
            "content-type": contentType
          ]
        )!
        
        let bodyData = FileDownloaderManifestParsingSpec.mutlipartData(
          boundary: boundary,
          manifest: nil,
          manifestSignature: nil,
          certificateChain: "\(getTestCertificate(.chainLeaf))\(getTestCertificate(.chainIntermediate))",
          directive: CertificateFixtures.testDirectiveNoUpdateAvailableIncorrectProjectId,
          directiveSignature: CertificateFixtures.testDirectiveNoUpdateAvailableValidChainLeafSignatureIncorrectProjectId
        )
        
        var resultUpdateResponse: UpdateResponse? = nil
        var errorOccurred: (any Error)? = nil
        downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
          resultUpdateResponse = updateResponse
        } errorBlock: { error in
          errorOccurred = error
        }
        
        expect(errorOccurred?.localizedDescription) == "Code signing certificate project ID or scope key does not match project ID or scope key in response part"
        expect(resultUpdateResponse).to(beNil())
      }
      
      it("json body signed unsigned request manifest signature optional") {
        let config = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
          UpdatesConfig.EXUpdatesConfigCodeSigningCertificateKey: getTestCertificate(.test),
          UpdatesConfig.EXUpdatesConfigCodeSigningMetadataKey: [:],
          UpdatesConfig.EXUpdatesConfigCodeSigningAllowUnsignedManifestsKey: true
        ])
        let downloader = FileDownloader(config: config)
        let contentType = "application/json"
        let response = HTTPURLResponse(
          url: URL(string: "https://exp.host/@test/test")!,
          statusCode: 200,
          httpVersion: "HTTP/1.1",
          headerFields: [
            "expo-protocol-version": "0",
            "expo-sfv-version": "0",
            "content-type": contentType,
          ]
        )!
        
        let bodyData = CertificateFixtures.testExpoUpdatesManifestBody.data(using: .utf8)!
        
        var resultUpdateResponse: UpdateResponse? = nil
        var errorOccurred: (any Error)? = nil
        downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
          resultUpdateResponse = updateResponse
        } errorBlock: { error in
          errorOccurred = error
        }
        
        expect(errorOccurred).to(beNil())
        expect(resultUpdateResponse).notTo(beNil())
      }
    }
  }
  
  private static func mutlipartData(
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
