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
        
        var resultUpdateManifest: Update? = nil
        var errorOccurred: (any Error)? = nil
        downloader.parseManifestResponse(response, withData: bodyData, database: database) { update in
          resultUpdateManifest = update
        } errorBlock: { error in
          errorOccurred = error
        }
        
        expect(errorOccurred).to(beNil())
        expect(resultUpdateManifest).notTo(beNil())
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
        
        var resultUpdateManifest: Update? = nil
        var errorOccurred: (any Error)? = nil
        downloader.parseManifestResponse(response, withData: bodyData, database: database) { update in
          resultUpdateManifest = update
        } errorBlock: { error in
          errorOccurred = error
        }
        
        expect(errorOccurred).to(beNil())
        expect(resultUpdateManifest).notTo(beNil())
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
          fromManifest: classicJSON,
          withBoundary: boundary,
          manifestSignature: nil,
          certificateChain: nil
        )
        
        var resultUpdateManifest: Update? = nil
        var errorOccurred: (any Error)? = nil
        downloader.parseManifestResponse(response, withData: bodyData, database: database) { update in
          resultUpdateManifest = update
        } errorBlock: { error in
          errorOccurred = error
        }
        
        expect(errorOccurred).to(beNil())
        expect(resultUpdateManifest).notTo(beNil())
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
          fromManifest: modernJSON,
          withBoundary: boundary,
          manifestSignature: modernJSONSignature,
          certificateChain: nil
        )
        
        var resultUpdateManifest: Update? = nil
        var errorOccurred: (any Error)? = nil
        downloader.parseManifestResponse(response, withData: bodyData, database: database) { update in
          resultUpdateManifest = update
        } errorBlock: { error in
          errorOccurred = error
        }
        
        expect(errorOccurred).to(beNil())
        expect(resultUpdateManifest).notTo(beNil())
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
        
        var resultUpdateManifest: Update? = nil
        var errorOccurred: (any Error)? = nil
        downloader.parseManifestResponse(response, withData: bodyData, database: database) { update in
          resultUpdateManifest = update
        } errorBlock: { error in
          errorOccurred = error
        }
        
        expect(errorOccurred?.localizedDescription) == "No expo-signature header specified"
        expect(resultUpdateManifest).to(beNil())
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
        
        var resultUpdateManifest: Update? = nil
        var errorOccurred: (any Error)? = nil
        downloader.parseManifestResponse(response, withData: bodyData, database: database) { update in
          resultUpdateManifest = update
        } errorBlock: { error in
          errorOccurred = error
        }
        
        expect(errorOccurred).to(beNil())
        expect(resultUpdateManifest).notTo(beNil())
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
          fromManifest: modernJSON,
          withBoundary: boundary,
          manifestSignature: chainLeafSignature,
          certificateChain: "\(leafCertificate)\(intermediateCertificate)"
        )
        
        var resultUpdateManifest: Update? = nil
        var errorOccurred: (any Error)? = nil
        downloader.parseManifestResponse(response, withData: bodyData, database: database) { update in
          resultUpdateManifest = update
        } errorBlock: { error in
          errorOccurred = error
        }
        
        expect(errorOccurred).to(beNil())
        expect(resultUpdateManifest).notTo(beNil())
        expect(resultUpdateManifest?.manifest.rawManifestJSON()["isVerified"] as? Bool) == true
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
          fromManifest: manifestBodyIncorrectProjectId,
          withBoundary: boundary,
          manifestSignature: validChainLeafSignatureIncorrectProjectId,
          certificateChain: "\(leafCertificate)\(intermediateCertificate)"
        )
        
        var resultUpdateManifest: Update? = nil
        var errorOccurred: (any Error)? = nil
        downloader.parseManifestResponse(response, withData: bodyData, database: database) { update in
          resultUpdateManifest = update
        } errorBlock: { error in
          errorOccurred = error
        }
        
        expect(errorOccurred?.localizedDescription) == "Invalid certificate for manifest project ID or scope key"
        expect(resultUpdateManifest).to(beNil())
      }
    }
  }
  
  private static func mutlipartData(
    fromManifest manifest: String,
    withBoundary boundary: String,
    manifestSignature signature: String?,
    certificateChain: String?
  ) -> Data {
    var body = Data()
    body.appendStringData("--\(boundary)\r\n")
    body.appendStringData("Content-Type: application/json\r\n")
    if let signature = signature {
      body.appendStringData("expo-signature: \(signature)\r\n")
    }
    body.appendStringData("Content-Disposition: inline; name=\"manifest\"\r\n\r\n")
    body.appendStringData(manifest)
    body.appendStringData("\r\n")
    if let certificateChain = certificateChain {
      body.appendStringData("--\(boundary)\r\n")
      body.appendStringData("Content-Type: application/x-pem-file\r\n")
      body.appendStringData("Content-Disposition: inline; name=\"certificate_chain\"\r\n\r\n")
      body.appendStringData(certificateChain)
      body.appendStringData("\r\n")
    }
    body.appendStringData("--\(boundary)--\r\n")
    return body
  }
  
}
