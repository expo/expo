//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

import EXManifests

class MiscellaneousSpec : ExpoSpec {
  override func spec() {
    describe("config") {
      it("gets runtime version") {
        let sdkOnlyConfig = UpdatesConfig.config(fromDictionary: [
          "EXUpdatesScopeKey": "test",
          "EXUpdatesSDKVersion": "38.0.0"
        ])
        expect(UpdatesUtils.getRuntimeVersion(withConfig: sdkOnlyConfig)) == "38.0.0"
        
        let runtimeOnlyConfig = UpdatesConfig.config(fromDictionary: [
          "EXUpdatesScopeKey": "test",
          "EXUpdatesRuntimeVersion": "1.0"
        ])
        expect(UpdatesUtils.getRuntimeVersion(withConfig: runtimeOnlyConfig)) == "1.0"
        
        let bothConfig = UpdatesConfig.config(fromDictionary: [
          "EXUpdatesScopeKey": "test",
          "EXUpdatesSDKVersion": "38.0.0",
          "EXUpdatesRuntimeVersion": "1.0"
        ])
        expect(UpdatesUtils.getRuntimeVersion(withConfig: bothConfig)) == "1.0"
      }
    }
    
    describe("normalized url origin") {
      it("works") {
        let urlNoPort = URL(string: "https://exp.host/test")!
        expect(UpdatesConfig.normalizedURLOrigin(url: urlNoPort)) == "https://exp.host"
        
        let urlDefaultPort = URL(string: "https://exp.host:443/test")!
        expect(UpdatesConfig.normalizedURLOrigin(url: urlDefaultPort)) == "https://exp.host"
        
        let urlOtherPort = URL(string: "https://exp.host:47/test")!
        expect(UpdatesConfig.normalizedURLOrigin(url: urlOtherPort)) == "https://exp.host:47"
      }
    }
    
    describe("asset filename") {
      it("is overridable") {
        let asset1 = UpdateAsset(key: nil, type: "bundle")
        let asset2 = UpdateAsset(key: nil, type: "bundle")
        expect(asset1) != asset2
        
        let assetSetFilename = UpdateAsset(key: nil, type: "bundle")
        let filenameFromDatabase = "filename.png"
        assetSetFilename.filename = filenameFromDatabase
        expect(assetSetFilename.filename) == filenameFromDatabase
      }
      
      it("works with extension") {
        let assetWithDotPrefix = UpdateAsset(key: "cat", type: ".jpeg")
        expect(assetWithDotPrefix.filename) == "cat.jpeg"
        
        let assetWithoutDotPrefix = UpdateAsset(key: "cat", type: "jpeg")
        expect(assetWithoutDotPrefix.filename) == "cat.jpeg"
        
        let assetWithoutKey = UpdateAsset(key: nil, type: "jpeg")
        expect(assetWithoutKey.filename.dropFirst(assetWithoutKey.filename.count - 5)) == ".jpeg"
      }
      
      it("works without extension") {
        let assetWithDotPrefix = UpdateAsset(key: "cat", type: nil)
        expect(assetWithDotPrefix.filename) == "cat"
      }
    }
  }
}
