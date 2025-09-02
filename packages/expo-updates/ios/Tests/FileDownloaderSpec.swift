//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

import EXManifests

class FileDownloaderSpec : ExpoSpec {
  override class func spec() {
    var testDatabaseDir: URL!
    var db: UpdatesDatabase!
    var logger: UpdatesLogger!

    beforeEach {
      let applicationSupportDir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).last
      testDatabaseDir = applicationSupportDir!.appendingPathComponent("UpdatesDatabaseTests")
      
      try? FileManager.default.removeItem(atPath: testDatabaseDir.path)
      
      if !FileManager.default.fileExists(atPath: testDatabaseDir.path) {
        try! FileManager.default.createDirectory(atPath: testDatabaseDir.path, withIntermediateDirectories: true)
      }
      
      db = UpdatesDatabase()
      db.databaseQueue.sync {
        try! db.openDatabase(inDirectory: testDatabaseDir, logger: UpdatesLogger())
      }

      logger = UpdatesLogger()
    }
    
    afterEach {
      db.databaseQueue.sync {
        db.closeDatabase()
      }
      
      try! FileManager.default.removeItem(atPath: testDatabaseDir.path)
    }
    
    describe("cache control") {
      it("works for legacy manifest") {
        let config = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0",
        ])
        let downloader = FileDownloader(config: config, logger: UpdatesLogger())
        let actual = downloader.createManifestRequest(withURL: URL(string: "https://exp.host/@test/test")!, extraHeaders: nil)
        expect(actual.cachePolicy) == .useProtocolCachePolicy
        expect(actual.value(forHTTPHeaderField: "Cache-Control")).to(beNil())
      }
      
      it("works for new manifest") {
        let config = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0",
        ])
        let downloader = FileDownloader(config: config, logger: UpdatesLogger())
        let actual = downloader.createManifestRequest(withURL: URL(string: "https://u.expo.dev/00000000-0000-0000-0000-000000000000")!, extraHeaders: nil)
        expect(actual.cachePolicy) == .useProtocolCachePolicy
        expect(actual.value(forHTTPHeaderField: "Cache-Control")).to(beNil())
      }
    }
    
    describe("extra headers") {
      it("works for object types") {
        let config = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0",
        ])
        let downloader = FileDownloader(config: config, logger: UpdatesLogger())
        let extraHeaders = [
          "expo-string": "test",
          "expo-number": 47.5,
          "expo-boolean": true,
          "expo-null": nil,
          "expo-nsnull": NSNull()
        ]
        let actual = downloader.createManifestRequest(withURL: URL(string: "https://u.expo.dev/00000000-0000-0000-0000-000000000000")!, extraHeaders: extraHeaders)
        
        expect(actual.value(forHTTPHeaderField: "expo-string")) == "test"
        expect(actual.value(forHTTPHeaderField: "expo-number")) == "47.5"
        expect(actual.value(forHTTPHeaderField: "expo-boolean")) == "true"
        expect(actual.value(forHTTPHeaderField: "expo-null")) == "null"
        expect(actual.value(forHTTPHeaderField: "expo-nsnull")) == "null"
      }
      
      it("override order") {
        let config = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0",
          UpdatesConfig.EXUpdatesConfigRequestHeadersKey: [
            // custom headers configured at build-time should be able to override preset headers
            "expo-updates-environment": "custom"
          ]
        ])
        let downloader = FileDownloader(config: config, logger: UpdatesLogger())

        // serverDefinedHeaders should not be able to override preset headers
        let extraHeaders = [
          "expo-platform": "android"
        ]
        
        let actual = downloader.createManifestRequest(withURL: URL(string: "https://u.expo.dev/00000000-0000-0000-0000-000000000000")!, extraHeaders: extraHeaders)
        
        expect(actual.value(forHTTPHeaderField: "expo-platform")) == "ios"
        expect(actual.value(forHTTPHeaderField: "expo-updates-environment")) == "custom"
      }
    }
    
    describe("get extra headers") {
      it("works") {
        let config = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
        ])
        
        let launchedUpdateUUIDString = "7c1d2bd0-f88b-454d-998c-7fa92a924dbf"
        let launchedUpdate = Update(
          manifest: ManifestFactory.manifest(forManifestJSON: [:]),
          config: config,
          database: db,
          updateId: UUID(uuidString: launchedUpdateUUIDString)!,
          scopeKey: "test",
          commitTime: Date(),
          runtimeVersion: "1.0",
          keep: true,
          status: .Status0_Unused,
          isDevelopmentMode: false,
          assetsFromManifest: [],
          url: URL(string: "https://exp.host/@test/test"),
          requestHeaders: [:]
        )
        launchedUpdate.failedLaunchCount = 1

        let embeddedUpdateUUIDString = "9433b1ed-4006-46b8-8aa7-fdc7eeb203fd"
        let embeddedUpdate = Update(
          manifest: ManifestFactory.manifest(forManifestJSON: [:]),
          config: config,
          database: db,
          updateId: UUID(uuidString: embeddedUpdateUUIDString)!,
          scopeKey: "test",
          commitTime: Calendar.current.date(byAdding: .day, value: -1, to: Date())!,
          runtimeVersion: "1.0",
          keep: true,
          status: .Status0_Unused,
          isDevelopmentMode: false,
          assetsFromManifest: [],
          url: URL(string: "https://exp.host/@test/test"),
          requestHeaders: [:]
        )
        embeddedUpdate.failedLaunchCount = 1

        db.databaseQueue.sync {
          try! db.addUpdate(launchedUpdate, config: config)
          try! db.addUpdate(embeddedUpdate, config: config)

          try! db.setExtraParam(key: "hello", value: "world", withScopeKey: config.scopeKey)
          try! db.setExtraParam(key: "what", value: "123", withScopeKey: config.scopeKey)

          let extraHeaders = FileDownloader.extraHeadersForRemoteUpdateRequest(
            withDatabase: db,
            config: config,
            logger: logger,
            launchedUpdate: launchedUpdate,
            embeddedUpdate: embeddedUpdate
          )
          expect(extraHeaders["Expo-Current-Update-ID"] as? String) == launchedUpdateUUIDString
          expect(extraHeaders["Expo-Embedded-Update-ID"] as? String) == embeddedUpdateUUIDString
          expect(extraHeaders["Expo-Extra-Params"] as? String).to(contain("what=\"123\""))
          expect(extraHeaders["Expo-Extra-Params"] as? String).to(contain("hello=\"world\""))
          expect(extraHeaders["Expo-Recent-Failed-Update-IDs"] as? String).to(contain("\"\(launchedUpdateUUIDString)\", \"\(embeddedUpdateUUIDString)\""))
        }
      }
      
      it("no launched or embedded update") {
        let config = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
        ])
        
        db.databaseQueue.sync {
          let extraHeaders = FileDownloader.extraHeadersForRemoteUpdateRequest(
            withDatabase: db,
            config: config,
            logger: logger,
            launchedUpdate: nil,
            embeddedUpdate: nil
          )
          expect(extraHeaders["Expo-Current-Update-ID"]).to(beNil())
          expect(extraHeaders["Expo-Embedded-Update-ID"]).to(beNil())
          expect(extraHeaders["Expo-Extra-Params"]).to(beNil())
        }
      }
    }
    
    describe("asset extra headers") {
      it("override order") {
        let config = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0",
          UpdatesConfig.EXUpdatesConfigRequestHeadersKey: [
            // custom headers configured at build-time should be able to override preset headers
            "expo-updates-environment": "custom"
          ]
        ])
        let downloader = FileDownloader(config: config, logger: UpdatesLogger())

        // serverDefinedHeaders should not be able to override preset headers
        let extraHeaders = [
          "expo-platform": "android"
        ]
        
        let actual = downloader.createGenericRequest(withURL: URL(string: "https://u.expo.dev/00000000-0000-0000-0000-000000000000")!, extraHeaders: extraHeaders)
        
        expect(actual.value(forHTTPHeaderField: "expo-platform")) == "ios"
        expect(actual.value(forHTTPHeaderField: "expo-updates-environment")) == "custom"
      }
      
      it("object types") {
        let config = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0",
        ])
        let downloader = FileDownloader(config: config, logger: UpdatesLogger())
        let extraHeaders = [
          "expo-string": "test",
          "expo-number": 47.5,
          "expo-boolean": true,
          "expo-null": nil,
          "expo-nsnull": NSNull()
        ]
        let actual = downloader.createGenericRequest(withURL: URL(string: "https://u.expo.dev/00000000-0000-0000-0000-000000000000")!, extraHeaders: extraHeaders)
        
        expect(actual.value(forHTTPHeaderField: "expo-string")) == "test"
        expect(actual.value(forHTTPHeaderField: "expo-number")) == "47.5"
        expect(actual.value(forHTTPHeaderField: "expo-boolean")) == "true"
        expect(actual.value(forHTTPHeaderField: "expo-null")) == "null"
        expect(actual.value(forHTTPHeaderField: "expo-nsnull")) == "null"
      }
    }
    
    describe("downloadAsset") {
      it("should report download progress") {
        let config = try! UpdatesConfig.config(fromDictionary: [
          UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
          UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0"
        ])

        let sessionConfig = URLSessionConfiguration.ephemeral
        sessionConfig.protocolClasses = [MockURLProtocol.self]

        let downloader = FileDownloader(config: config, urlSessionConfiguration: sessionConfig, logger: logger)

        let responseBody = "hello world this is a test"
        let expectedHash = "-NfUrZcahFwJ6UrL_Vq0ZCh0dses8IUEv-0WS_d61uQ" // Corrected hash
        MockURLProtocol.responseData = responseBody.data(using: .utf8)
        MockURLProtocol.error = nil

        let tempDir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try! FileManager.default.createDirectory(at: tempDir, withIntermediateDirectories: true)
        let destinationURL = tempDir.appendingPathComponent("testfile.txt")

        var progressValues: [Double] = []
        let progressBlock = { (progress: Double) in
          progressValues.append(progress)
        }

        var success = false
        var error: Error?
        waitUntil { done in
          downloader.downloadAsset(
            fromURL: URL(string: "https://example.com/testfile.txt")!,
            verifyingHash: expectedHash,
            toPath: destinationURL.path,
            extraHeaders: [:],
            progressBlock: progressBlock,
            successBlock: { _, _, _ in
              success = true
              done()
            },
            errorBlock: { err in
              error = err
              done()
            }
          )
        }

        expect(success).to(beTrue())
        expect(error).to(beNil())

        expect(progressValues).toNot(beEmpty())
        expect(progressValues.last).to(beCloseTo(1.0))
        // check progress is increasing
        for i in 0..<(progressValues.count - 1) {
          expect(progressValues[i]) <= progressValues[i + 1]
        }

        try! FileManager.default.removeItem(at: tempDir)
      }
    }
  }
 }

class MockURLProtocol: URLProtocol {
  static var responseData: Data?
  static var error: Error?

  override class func canInit(with request: URLRequest) -> Bool {
    return true
  }

  override class func canonicalRequest(for request: URLRequest) -> URLRequest {
    return request
  }

  override func startLoading() {
    if let error = MockURLProtocol.error {
      self.client?.urlProtocol(self, didFailWithError: error)
      return
    }

    let response = HTTPURLResponse(
      url: self.request.url!,
      statusCode: 200,
      httpVersion: nil,
      headerFields: ["Content-Length": "\(MockURLProtocol.responseData?.count ?? 0)"]
    )!
    self.client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)

    if let data = MockURLProtocol.responseData {
      // To test progress, send data in small chunks.
      let chunkSize = 5
      var offset = 0
      while offset < data.count {
        let chunk = data.subdata(in: offset ..< min(offset + chunkSize, data.count))
        self.client?.urlProtocol(self, didLoad: chunk)
        offset += chunkSize
      }
    }

    self.client?.urlProtocolDidFinishLoading(self)
  }

  override func stopLoading() {}
}
