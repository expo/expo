//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

import EXManifests

class UpdateSpec : ExpoSpec {
  let config = UpdatesConfig.config(fromDictionary: [
    UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test"
  ])
  let database = UpdatesDatabase()
  
  override func spec() {
    describe("instantiation") {
      it("works for legacy manifest") {
        let legacyManifest = [
          "sdkVersion": "39.0.0",
          "releaseId": "0eef8214-4833-4089-9dff-b4138a14f196",
          "commitTime": "2020-11-11T00:17:54.797Z",
          "bundleUrl": "https://url.to/bundle.js"
        ]
        
        let responseHeaderData = ResponseHeaderData(
          protocolVersionRaw: nil,
          serverDefinedHeadersRaw: nil,
          manifestFiltersRaw: nil,
          manifestSignature: nil
        )
        
        expect(try! Update.update(
          withManifest: legacyManifest,
          responseHeaderData: responseHeaderData,
          extensions: [:],
          config: self.config,
          database: self.database
        )).notTo(beNil())
      }
      
      it("works for new manifest") {
        let easNewManifest = [
          "runtimeVersion": "1",
          "id": "0eef8214-4833-4089-9dff-b4138a14f196",
          "createdAt": "2020-11-11T00:17:54.797Z",
          "launchAsset": [
            "url": "https://url.to/bundle.js",
            "contentType": "application/javascript"
          ]
        ]
        
        let responseHeaderData = ResponseHeaderData(
          protocolVersionRaw: "0",
          serverDefinedHeadersRaw: nil,
          manifestFiltersRaw: nil,
          manifestSignature: nil
        )
        
        expect(try! Update.update(
          withManifest: easNewManifest,
          responseHeaderData: responseHeaderData,
          extensions: [:],
          config: self.config,
          database: self.database
        )).notTo(beNil())
      }
      
      it("throws for unsupported protocol version") {
        let easNewManifest = [
          "runtimeVersion": "1",
          "id": "0eef8214-4833-4089-9dff-b4138a14f196",
          "createdAt": "2020-11-11T00:17:54.797Z",
          "launchAsset": [
            "url": "https://url.to/bundle.js",
            "contentType": "application/javascript"
          ]
        ]
        
        let responseHeaderData = ResponseHeaderData(
          protocolVersionRaw: "2",
          serverDefinedHeadersRaw: nil,
          manifestFiltersRaw: nil,
          manifestSignature: nil
        )
        
        expect(try Update.update(
          withManifest: easNewManifest,
          responseHeaderData: responseHeaderData,
          extensions: [:],
          config: self.config,
          database: self.database
        )).to(throwError(UpdateError.invalidExpoProtocolVersion))
      }
      
      it("works for embedded legacy manifest") {
        let legacyManifest = [
          "sdkVersion": "39.0.0",
          "releaseId": "0eef8214-4833-4089-9dff-b4138a14f196",
          "commitTime": "2020-11-11T00:17:54.797Z",
          "bundleUrl": "https://url.to/bundle.js"
        ]
        expect(Update.update(
          withEmbeddedManifest: legacyManifest,
          config: self.config,
          database: self.database
        )).notTo(beNil())
      }
      
      it("works for embedded bare manifest") {
        let bareManifest = [
          "id": "0eef8214-4833-4089-9dff-b4138a14f196",
          "commitTime": 1609975977832
        ]
        expect(Update.update(
          withEmbeddedManifest: bareManifest,
          config: self.config,
          database: self.database
        )).notTo(beNil())
      }
    }
  }
}
