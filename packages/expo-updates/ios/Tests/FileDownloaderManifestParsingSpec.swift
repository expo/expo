//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

import EXManifests

extension Data {
  public mutating func appendStringData(_ str: String) {
    self.append(str.data(using: .utf8)!)
  }
}

class FileDownloaderManifestParsingSpec : ExpoSpec {
  override func spec() {
    let database = UpdatesDatabase()
    let classicJSON = TestHelper.testClassicBody
    let modernJSON = TestHelper.testBody
    let modernJSONCertificate = try! TestHelper.getTestCertificate(.test)
    let modernJSONSignature = TestHelper.testSignature
    let leafCertificate = try! TestHelper.getTestCertificate(.chainLeaf)
    let intermediateCertificate = try! TestHelper.getTestCertificate(.chainIntermediate)
    let rootCertificate = try! TestHelper.getTestCertificate(.chainRoot)
    let chainLeafSignature = TestHelper.testValidChainLeafSignature
    let manifestBodyIncorrectProjectId = TestHelper.testNewManifestBodyIncorrectProjectId
    let validChainLeafSignatureIncorrectProjectId = TestHelper.testNewManifestBodyValidChainLeafSignatureIncorrectProjectId
    
    describe("manifest parsing") {
      it("JSON body") {
        let config = UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
        ])
        let downloader = FileDownloader(config: config)
        let contentType = "application/json"
        let response = HTTPURLResponse(
          url: URL(string: "https://exp.host/@test/test")!,
          statusCode: 200,
          httpVersion: "HTTP/1.1",
          headerFields: ["content-type": contentType]
        )!
        
        let bodyData = classicJSON.data(using: .utf8)!
        
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
        let config = UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
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
          manifest: classicJSON,
          manifestSignature: nil,
          certificateChain: nil,
          directive: TestHelper.testDirectiveNoUpdateAvailable,
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
        let config = UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
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
          directive: TestHelper.testDirectiveNoUpdateAvailable,
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
        let config = UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
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
          directive: TestHelper.testDirectiveNoUpdateAvailable,
          directiveSignature: nil
        )
        
        var resultUpdateResponse: UpdateResponse? = nil
        var errorOccurred: (any Error)? = nil
        downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
          resultUpdateResponse = updateResponse
        } errorBlock: { error in
          errorOccurred = error
        }
        
        expect(errorOccurred?.localizedDescription) == "Multipart response missing manifest part. Manifest is required in version 0 of the expo-updates protocol. This may be due to the update being a rollback or other directive."
        expect(resultUpdateResponse).to(beNil())
      }
      
      it("multipart body no relevant parts") {
        let config = UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
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
      
      it("json body signed") {
        let config = UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
          UpdatesConfig.EXUpdatesConfigCodeSigningCertificateKey: modernJSONCertificate,
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
            "expo-signature": modernJSONSignature,
          ]
        )!
        
        let bodyData = modernJSON.data(using: .utf8)!
        
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
        let config = UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
          UpdatesConfig.EXUpdatesConfigCodeSigningCertificateKey: modernJSONCertificate,
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
          manifest: modernJSON,
          manifestSignature: modernJSONSignature,
          certificateChain: nil,
          directive: TestHelper.testDirectiveNoUpdateAvailable,
          directiveSignature: TestHelper.testDirectiveNoUpdateAvailableSignature
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
        let config = UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
          UpdatesConfig.EXUpdatesConfigCodeSigningCertificateKey: modernJSONCertificate,
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
        
        let bodyData = modernJSON.data(using: .utf8)!
        
        var resultUpdateResponse: UpdateResponse? = nil
        var errorOccurred: (any Error)? = nil
        downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
          resultUpdateResponse = updateResponse
        } errorBlock: { error in
          errorOccurred = error
        }
        
        expect(errorOccurred?.localizedDescription) == "No expo-signature header specified"
        expect(resultUpdateResponse).to(beNil())
      }
      
      it("multipart body signed certificate particular experience") {
        let config = UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
          UpdatesConfig.EXUpdatesConfigCodeSigningCertificateKey: rootCertificate,
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
          manifest: modernJSON,
          manifestSignature: chainLeafSignature,
          certificateChain: "\(leafCertificate)\(intermediateCertificate)",
          directive: TestHelper.testDirectiveNoUpdateAvailable,
          directiveSignature: TestHelper.testDirectiveNoUpdateAvailableValidChainLeafSignature
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
        let config = UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
          UpdatesConfig.EXUpdatesConfigCodeSigningCertificateKey: rootCertificate,
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
          manifest: manifestBodyIncorrectProjectId,
          manifestSignature: validChainLeafSignatureIncorrectProjectId,
          certificateChain: "\(leafCertificate)\(intermediateCertificate)",
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
        
        expect(errorOccurred?.localizedDescription) == "Invalid certificate for manifest project ID or scope key"
        expect(resultUpdateResponse).to(beNil())
      }
      
      it("multipart body signed certificate particular experience incorrect experience in directive") {
        let config = UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
          UpdatesConfig.EXUpdatesConfigCodeSigningCertificateKey: rootCertificate,
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
          certificateChain: "\(leafCertificate)\(intermediateCertificate)",
          directive: TestHelper.testDirectiveNoUpdateAvailableIncorrectProjectId,
          directiveSignature: TestHelper.testDirectiveNoUpdateAvailableValidChainLeafSignatureIncorrectProjectId
        )
        
        var resultUpdateResponse: UpdateResponse? = nil
        var errorOccurred: (any Error)? = nil
        downloader.parseManifestResponse(response, withData: bodyData, database: database) { updateResponse in
          resultUpdateResponse = updateResponse
        } errorBlock: { error in
          errorOccurred = error
        }
        
        expect(errorOccurred?.localizedDescription) == "Invalid certificate for directive project ID or scope key"
        expect(resultUpdateResponse).to(beNil())
      }
      
      it("json body signed unsigned request manifest signature optional") {
        let config = UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
          UpdatesConfig.EXUpdatesConfigCodeSigningCertificateKey: modernJSONCertificate,
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
        
        let bodyData = modernJSON.data(using: .utf8)!
        
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
