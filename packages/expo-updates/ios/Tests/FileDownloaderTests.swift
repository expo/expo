//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Testing

@testable import EXUpdates

import EXManifests

private final class FileDownloaderHermesDiffTestsBundle {}

// URLProtocol used to intercept downloader requests so we can inspect headers and
// return responses without hitting the network.
private final class TestURLProtocol: URLProtocol {
  static var lastRequest: URLRequest?
  static var requests: [URLRequest] = []
  static var requestHandler: ((URLRequest) throws -> (HTTPURLResponse, Data?))?

  override class func canInit(with request: URLRequest) -> Bool {
    return true
  }

  override class func canonicalRequest(for request: URLRequest) -> URLRequest {
    return request
  }

  override func startLoading() {
    guard let handler = TestURLProtocol.requestHandler else {
      fatalError("TestURLProtocol requestHandler not set")
    }

    TestURLProtocol.lastRequest = request
    TestURLProtocol.requests.append(request)

    do {
      let (response, data) = try handler(request)
      client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
      if let data {
        client?.urlProtocol(self, didLoad: data)
      }
      client?.urlProtocolDidFinishLoading(self)
    } catch {
      client?.urlProtocol(self, didFailWithError: error)
    }
  }

  override func stopLoading() {
    // no-op
  }

  static func reset() {
    lastRequest = nil
    requests = []
    requestHandler = nil
  }
}

private class MockURLProtocol: URLProtocol {
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

@Suite("FileDownloader", .serialized)
@MainActor
class FileDownloaderTests {
  var testDatabaseDir: URL
  var testUpdatesDir: URL
  var db: UpdatesDatabase
  var logger: UpdatesLogger
  var updatesDirectory: URL

  init() throws {
    let applicationSupportDir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).last
    testDatabaseDir = applicationSupportDir!.appendingPathComponent("UpdatesDatabaseTests")
    testUpdatesDir = applicationSupportDir!.appendingPathComponent("UpdatesDirectoryTests")

    try? FileManager.default.removeItem(atPath: testDatabaseDir.path)
    try? FileManager.default.removeItem(atPath: testUpdatesDir.path)

    if !FileManager.default.fileExists(atPath: testDatabaseDir.path) {
      try FileManager.default.createDirectory(atPath: testDatabaseDir.path, withIntermediateDirectories: true)
    }
    if !FileManager.default.fileExists(atPath: testUpdatesDir.path) {
      try FileManager.default.createDirectory(atPath: testUpdatesDir.path, withIntermediateDirectories: true)
    }

    db = UpdatesDatabase()

    logger = UpdatesLogger()
    updatesDirectory = testUpdatesDir

    db.databaseQueue.sync {
      try! db.openDatabase(inDirectory: testDatabaseDir, logger: UpdatesLogger())
    }
  }

  deinit {
    db.databaseQueue.sync {
      db.closeDatabase()
    }

    TestURLProtocol.reset()

    try? FileManager.default.removeItem(atPath: testDatabaseDir.path)
    try? FileManager.default.removeItem(atPath: testUpdatesDir.path)
  }

  // MARK: - cache control

  @Test
  func `cache control works for legacy manifest`() throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0",
    ])
    let downloader = FileDownloader(
      config: config,
      logger: logger,
      updatesDirectory: updatesDirectory,
      database: db
    )
    let actual = downloader.createManifestRequest(withURL: URL(string: "https://exp.host/@test/test")!, extraHeaders: nil)
    #expect(actual.cachePolicy == .useProtocolCachePolicy)
    #expect(actual.value(forHTTPHeaderField: "Cache-Control") == nil)
  }

  @Test
  func `cache control works for new manifest`() throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0",
    ])
    let downloader = FileDownloader(
      config: config,
      logger: logger,
      updatesDirectory: updatesDirectory,
      database: db
    )
    let actual = downloader.createManifestRequest(withURL: URL(string: "https://u.expo.dev/00000000-0000-0000-0000-000000000000")!, extraHeaders: nil)
    #expect(actual.cachePolicy == .useProtocolCachePolicy)
    #expect(actual.value(forHTTPHeaderField: "Cache-Control") == nil)
  }

  // MARK: - extra headers

  @Test
  func `extra headers works for object types`() throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0",
    ])
    let downloader = FileDownloader(
      config: config,
      logger: logger,
      updatesDirectory: updatesDirectory,
      database: db
    )
    let extraHeaders: [String: Any?] = [
      "expo-string": "test",
      "expo-number": 47.5,
      "expo-boolean": true,
      "expo-null": nil,
      "expo-nsnull": NSNull()
    ]
    let actual = downloader.createManifestRequest(withURL: URL(string: "https://u.expo.dev/00000000-0000-0000-0000-000000000000")!, extraHeaders: extraHeaders)

    #expect(actual.value(forHTTPHeaderField: "expo-string") == "test")
    #expect(actual.value(forHTTPHeaderField: "expo-number") == "47.5")
    #expect(actual.value(forHTTPHeaderField: "expo-boolean") == "true")
    #expect(actual.value(forHTTPHeaderField: "expo-null") == "null")
    #expect(actual.value(forHTTPHeaderField: "expo-nsnull") == "null")
  }

  @Test
  func `extra headers override order`() throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0",
      UpdatesConfig.EXUpdatesConfigRequestHeadersKey: [
        // custom headers configured at build-time should be able to override preset headers
        "expo-updates-environment": "custom"
      ]
    ])
    let downloader = FileDownloader(
      config: config,
      logger: logger,
      updatesDirectory: updatesDirectory,
      database: db
    )

    // serverDefinedHeaders should not be able to override preset headers
    let extraHeaders = [
      "expo-platform": "android"
    ]

    let actual = downloader.createManifestRequest(withURL: URL(string: "https://u.expo.dev/00000000-0000-0000-0000-000000000000")!, extraHeaders: extraHeaders)

    #expect(actual.value(forHTTPHeaderField: "expo-platform") == "ios")
    #expect(actual.value(forHTTPHeaderField: "expo-updates-environment") == "custom")
  }

  // MARK: - get extra headers

  @Test
  func `get extra headers works`() throws {
    let config = try UpdatesConfig.config(fromDictionary: [
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
      #expect(extraHeaders["Expo-Current-Update-ID"] as? String == launchedUpdateUUIDString)
      #expect(extraHeaders["Expo-Embedded-Update-ID"] as? String == embeddedUpdateUUIDString)
      #expect((extraHeaders["Expo-Extra-Params"] as? String)?.contains("what=\"123\"") == true)
      #expect((extraHeaders["Expo-Extra-Params"] as? String)?.contains("hello=\"world\"") == true)
      #expect((extraHeaders["Expo-Recent-Failed-Update-IDs"] as? String)?.contains("\"\(launchedUpdateUUIDString)\", \"\(embeddedUpdateUUIDString)\"") == true)
    }
  }

  @Test
  func `get extra headers no launched or embedded update`() throws {
    let config = try UpdatesConfig.config(fromDictionary: [
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
      #expect(extraHeaders["Expo-Current-Update-ID"] == nil)
      #expect(extraHeaders["Expo-Embedded-Update-ID"] == nil)
      #expect(extraHeaders["Expo-Extra-Params"] == nil)
    }
  }

  @Test
  func `includes conditional headers for asset requests`() throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://exp.host/@test/test",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
      UpdatesConfig.EXUpdatesConfigScopeKeyKey: "test-scope"
    ])

    let launchedUpdateId = UUID()
    let requestedUpdateId = UUID()

    let launchedUpdateIdLower = launchedUpdateId.uuidString.lowercased()
    let requestedUpdateIdLower = requestedUpdateId.uuidString.lowercased()

    let launchedUpdate = Update(
      manifest: ManifestFactory.manifest(forManifestJSON: [:]),
      config: config,
      database: db,
      updateId: launchedUpdateId,
      scopeKey: config.scopeKey,
      commitTime: Date(),
      runtimeVersion: config.runtimeVersion,
      keep: true,
      status: .StatusReady,
      isDevelopmentMode: false,
      assetsFromManifest: [],
      url: config.updateUrl,
      requestHeaders: [:]
    )

    let requestedUpdate = Update(
      manifest: ManifestFactory.manifest(forManifestJSON: [:]),
      config: config,
      database: db,
      updateId: requestedUpdateId,
      scopeKey: config.scopeKey,
      commitTime: Date(),
      runtimeVersion: config.runtimeVersion,
      keep: true,
      status: .StatusReady,
      isDevelopmentMode: false,
      assetsFromManifest: [],
      url: config.updateUrl,
      requestHeaders: [:]
    )

    let extraHeaders = FileDownloader.extraHeadersForRemoteAssetRequest(
      launchedUpdate: launchedUpdate,
      embeddedUpdate: nil,
      requestedUpdate: requestedUpdate
    )

    #expect(extraHeaders["Expo-Current-Update-ID"] as? String == launchedUpdateIdLower)
    #expect(extraHeaders["Expo-Requested-Update-ID"] as? String == requestedUpdateIdLower)
  }

  // MARK: - asset extra headers

  @Test
  func `asset extra headers override order`() throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0",
      UpdatesConfig.EXUpdatesConfigRequestHeadersKey: [
        // custom headers configured at build-time should be able to override preset headers
        "expo-updates-environment": "custom"
      ]
    ])
    let downloader = FileDownloader(
      config: config,
      logger: logger,
      updatesDirectory: updatesDirectory,
      database: db
    )

    // serverDefinedHeaders should not be able to override preset headers
    let extraHeaders = [
      "expo-platform": "android"
    ]

    let actual = downloader.createGenericRequest(withURL: URL(string: "https://u.expo.dev/00000000-0000-0000-0000-000000000000")!, extraHeaders: extraHeaders)

    #expect(actual.value(forHTTPHeaderField: "expo-platform") == "ios")
    #expect(actual.value(forHTTPHeaderField: "expo-updates-environment") == "custom")
  }

  @Test
  func `asset extra headers object types`() throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0",
    ])
    let downloader = FileDownloader(
      config: config,
      logger: logger,
      updatesDirectory: updatesDirectory,
      database: db
    )
    let extraHeaders: [String: Any?] = [
      "expo-string": "test",
      "expo-number": 47.5,
      "expo-boolean": true,
      "expo-null": nil,
      "expo-nsnull": NSNull()
    ]
    let actual = downloader.createGenericRequest(withURL: URL(string: "https://u.expo.dev/00000000-0000-0000-0000-000000000000")!, extraHeaders: extraHeaders)

    #expect(actual.value(forHTTPHeaderField: "expo-string") == "test")
    #expect(actual.value(forHTTPHeaderField: "expo-number") == "47.5")
    #expect(actual.value(forHTTPHeaderField: "expo-boolean") == "true")
    #expect(actual.value(forHTTPHeaderField: "expo-null") == "null")
    #expect(actual.value(forHTTPHeaderField: "expo-nsnull") == "null")
  }

  // MARK: - patch negotiation headers

  @Test
  func `sets diff headers when patch allowed`() async throws {
    TestURLProtocol.reset()

    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/11111111-1111-1111-1111-111111111111",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0.0",
      UpdatesConfig.EXUpdatesConfigScopeKeyKey: "test-scope"
    ])

    let sessionConfiguration = URLSessionConfiguration.ephemeral
    sessionConfiguration.protocolClasses = [TestURLProtocol.self]

    let downloader = FileDownloader(
      config: config,
      urlSessionConfiguration: sessionConfiguration,
      logger: logger,
      updatesDirectory: updatesDirectory,
      database: db
    )

    let launchedUpdate = Update(
      manifest: ManifestFactory.manifest(forManifestJSON: [:]),
      config: config,
      database: db,
      updateId: UUID(),
      scopeKey: config.scopeKey,
      commitTime: Date(),
      runtimeVersion: config.runtimeVersion,
      keep: true,
      status: .StatusReady,
      isDevelopmentMode: false,
      assetsFromManifest: [],
      url: config.updateUrl,
      requestHeaders: [:]
    )

    let requestedUpdate = Update(
      manifest: ManifestFactory.manifest(forManifestJSON: [:]),
      config: config,
      database: db,
      updateId: UUID(),
      scopeKey: config.scopeKey,
      commitTime: Date(),
      runtimeVersion: config.runtimeVersion,
      keep: true,
      status: .StatusReady,
      isDevelopmentMode: false,
      assetsFromManifest: [],
      url: config.updateUrl,
      requestHeaders: [:]
    )

    let asset = UpdateAsset(key: "bundle", type: "hbc")
    asset.isLaunchAsset = true
    asset.url = URL(string: "https://example.com/\(UUID().uuidString).hbc")

    let destinationURL = updatesDirectory.appendingPathComponent("bundle-\(UUID().uuidString).hbc")

    let extraHeaders = FileDownloader.extraHeadersForRemoteAssetRequest(
      launchedUpdate: launchedUpdate,
      embeddedUpdate: nil,
      requestedUpdate: requestedUpdate
    )

    TestURLProtocol.requestHandler = { request in
      let response = HTTPURLResponse(
        url: request.url!,
        statusCode: 200,
        httpVersion: nil,
        headerFields: ["Content-Type": "application/octet-stream"]
      )!
      return (response, "test-data".data(using: .utf8))
    }

    await withCheckedContinuation { continuation in
      downloader.downloadAsset(
        asset: asset,
        fromURL: asset.url!,
        verifyingHash: nil,
        toPath: destinationURL.path,
        extraHeaders: extraHeaders,
        allowPatch: true,
        launchedUpdate: launchedUpdate,
        requestedUpdate: requestedUpdate,
        progressBlock: nil,
        successBlock: { _, _, _ in
          continuation.resume()
        },
        errorBlock: { error in
          Issue.record("Unexpected error downloading asset: \(error)")
          continuation.resume()
        }
      )
    }

    #expect(TestURLProtocol.requests.count == 1)

    guard let request = TestURLProtocol.requests.last else {
      Issue.record("Expected intercepted request")
      return
    }

    #expect(request.value(forHTTPHeaderField: "A-IM") == "bsdiff")
  }

  @Test
  func `omits diff headers when patch disabled`() async throws {
    TestURLProtocol.reset()

    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/22222222-2222-2222-2222-222222222222",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0.0",
      UpdatesConfig.EXUpdatesConfigScopeKeyKey: "test-scope"
    ])

    let sessionConfiguration = URLSessionConfiguration.ephemeral
    sessionConfiguration.protocolClasses = [TestURLProtocol.self]

    let downloader = FileDownloader(
      config: config,
      urlSessionConfiguration: sessionConfiguration,
      logger: logger,
      updatesDirectory: updatesDirectory,
      database: db
    )

    let launchedUpdate = Update(
      manifest: ManifestFactory.manifest(forManifestJSON: [:]),
      config: config,
      database: db,
      updateId: UUID(),
      scopeKey: config.scopeKey,
      commitTime: Date(),
      runtimeVersion: config.runtimeVersion,
      keep: true,
      status: .StatusReady,
      isDevelopmentMode: false,
      assetsFromManifest: [],
      url: config.updateUrl,
      requestHeaders: [:]
    )

    let requestedUpdate = Update(
      manifest: ManifestFactory.manifest(forManifestJSON: [:]),
      config: config,
      database: db,
      updateId: UUID(),
      scopeKey: config.scopeKey,
      commitTime: Date(),
      runtimeVersion: config.runtimeVersion,
      keep: true,
      status: .StatusReady,
      isDevelopmentMode: false,
      assetsFromManifest: [],
      url: config.updateUrl,
      requestHeaders: [:]
    )

    let asset = UpdateAsset(key: "bundle", type: "hbc")
    asset.isLaunchAsset = true
    asset.url = URL(string: "https://example.com/\(UUID().uuidString).hbc")

    let destinationURL = updatesDirectory.appendingPathComponent("bundle-\(UUID().uuidString).hbc")

    let extraHeaders = FileDownloader.extraHeadersForRemoteAssetRequest(
      launchedUpdate: launchedUpdate,
      embeddedUpdate: nil,
      requestedUpdate: requestedUpdate
    )

    TestURLProtocol.requestHandler = { request in
      let response = HTTPURLResponse(
        url: request.url!,
        statusCode: 200,
        httpVersion: nil,
        headerFields: ["Content-Type": "application/octet-stream"]
      )!
      return (response, "fallback-data".data(using: .utf8))
    }

    await withCheckedContinuation { continuation in
      downloader.downloadAsset(
        asset: asset,
        fromURL: asset.url!,
        verifyingHash: nil,
        toPath: destinationURL.path,
        extraHeaders: extraHeaders,
        allowPatch: false,
        launchedUpdate: launchedUpdate,
        requestedUpdate: requestedUpdate,
        progressBlock: nil,
        successBlock: { _, _, _ in
          continuation.resume()
        },
        errorBlock: { error in
          Issue.record("Unexpected error downloading asset: \(error)")
          continuation.resume()
        }
      )
    }

    #expect(TestURLProtocol.requests.count == 1)
    guard let request = TestURLProtocol.requests.last else {
      Issue.record("Expected intercepted request")
      return
    }

    #expect(request.value(forHTTPHeaderField: "A-IM") == nil)
    #expect(request.value(forHTTPHeaderField: "Accept") == "*/*")
  }

  @Test
  func `falls back to full download when patch metadata invalid`() async throws {
    TestURLProtocol.reset()

    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/33333333-3333-3333-3333-333333333333",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0.0",
      UpdatesConfig.EXUpdatesConfigScopeKeyKey: "test-scope"
    ])

    let sessionConfiguration = URLSessionConfiguration.ephemeral
    sessionConfiguration.protocolClasses = [TestURLProtocol.self]

    let downloader = FileDownloader(
      config: config,
      urlSessionConfiguration: sessionConfiguration,
      logger: logger,
      updatesDirectory: updatesDirectory,
      database: db
    )

    let launchedUpdate = Update(
      manifest: ManifestFactory.manifest(forManifestJSON: [:]),
      config: config,
      database: db,
      updateId: UUID(),
      scopeKey: config.scopeKey,
      commitTime: Date(),
      runtimeVersion: config.runtimeVersion,
      keep: true,
      status: .StatusReady,
      isDevelopmentMode: false,
      assetsFromManifest: [],
      url: config.updateUrl,
      requestHeaders: [:]
    )

    let requestedUpdate = Update(
      manifest: ManifestFactory.manifest(forManifestJSON: [:]),
      config: config,
      database: db,
      updateId: UUID(),
      scopeKey: config.scopeKey,
      commitTime: Date(),
      runtimeVersion: config.runtimeVersion,
      keep: true,
      status: .StatusReady,
      isDevelopmentMode: false,
      assetsFromManifest: [],
      url: config.updateUrl,
      requestHeaders: [:]
    )

    let asset = UpdateAsset(key: "bundle", type: "hbc")
    asset.isLaunchAsset = true
    asset.url = URL(string: "https://example.com/\(UUID().uuidString).hbc")

    let destinationURL = updatesDirectory.appendingPathComponent("bundle-\(UUID().uuidString).hbc")

    let extraHeaders = FileDownloader.extraHeadersForRemoteAssetRequest(
      launchedUpdate: launchedUpdate,
      embeddedUpdate: nil,
      requestedUpdate: requestedUpdate
    )

    var requestCount = 0
    let mismatchedBaseId = UUID().uuidString.lowercased()

    TestURLProtocol.requestHandler = { request in
      requestCount += 1

      if requestCount == 1 {
        let response = HTTPURLResponse(
          url: request.url!,
          statusCode: 226,
          httpVersion: nil,
          headerFields: [
            "Content-Type": "application/javascript",
            "IM": "bsdiff",
            "expo-base-update-id": mismatchedBaseId
          ]
        )!
        return (response, "patch-data".data(using: .utf8))
      }

      let response = HTTPURLResponse(
        url: request.url!,
        statusCode: 200,
        httpVersion: nil,
        headerFields: ["Content-Type": "application/javascript"]
      )!
      return (response, "full-data".data(using: .utf8))
    }

    await withCheckedContinuation { continuation in
      downloader.downloadAsset(
        asset: asset,
        fromURL: asset.url!,
        verifyingHash: nil,
        toPath: destinationURL.path,
        extraHeaders: extraHeaders,
        allowPatch: true,
        launchedUpdate: launchedUpdate,
        requestedUpdate: requestedUpdate,
        progressBlock: nil,
        successBlock: { _, _, _ in
          continuation.resume()
        },
        errorBlock: { error in
          Issue.record("Unexpected error downloading asset: \(error)")
          continuation.resume()
        }
      )
    }

    #expect(requestCount == 2)
    #expect(TestURLProtocol.requests.count == 2)

    guard
      let firstRequest = TestURLProtocol.requests.first,
      let secondRequest = TestURLProtocol.requests.last else {
      Issue.record("Expected two intercepted requests")
      return
    }

    #expect(firstRequest.value(forHTTPHeaderField: "A-IM") == "bsdiff")
    #expect(secondRequest.value(forHTTPHeaderField: "A-IM") == nil)
  }

  // MARK: - downloadAsset

  @Test
  func `should report download progress`() async throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0"
    ])

    let sessionConfig = URLSessionConfiguration.ephemeral
    sessionConfig.protocolClasses = [MockURLProtocol.self]

    let downloader = FileDownloader(
      config: config,
      urlSessionConfiguration: sessionConfig,
      logger: logger,
      updatesDirectory: updatesDirectory,
      database: db
    )

    let responseBody = "hello world this is a test"
    let expectedHash = "-NfUrZcahFwJ6UrL_Vq0ZCh0dses8IUEv-0WS_d61uQ" // Corrected hash
    MockURLProtocol.responseData = responseBody.data(using: .utf8)
    MockURLProtocol.error = nil

    let tempDir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    try FileManager.default.createDirectory(at: tempDir, withIntermediateDirectories: true)
    let destinationURL = tempDir.appendingPathComponent("testfile.txt")

    var progressValues: [Double] = []
    let progressBlock = { (progress: Double) in
      progressValues.append(progress)
    }

    var success = false
    var error: Error?
    let testAsset = UpdateAsset(key: "test-asset", type: "txt")

    await withCheckedContinuation { continuation in
      downloader.downloadAsset(
        asset: testAsset,
        fromURL: URL(string: "https://example.com/testfile.txt")!,
        verifyingHash: expectedHash,
        toPath: destinationURL.path,
        extraHeaders: [:],
        allowPatch: false,
        launchedUpdate: nil,
        requestedUpdate: nil,
        progressBlock: progressBlock,
        successBlock: { _, _, _ in
          success = true
          continuation.resume()
        },
        errorBlock: { err in
          error = err
          continuation.resume()
        }
      )
    }

    #expect(success == true)
    #expect(error == nil)

    #expect(progressValues.isEmpty == false)
    #expect(progressValues.last != nil)
    if let lastProgress = progressValues.last {
      #expect(abs(lastProgress - 1.0) < 0.01)
    }
    // check progress is increasing
    for i in 0..<(progressValues.count - 1) {
      #expect(progressValues[i] <= progressValues[i + 1])
    }

    try FileManager.default.removeItem(at: tempDir)
  }
}

// MARK: - Hermes diff application

@Suite("Hermes diff application", .serialized)
class HermesDiffApplicationTests {
  var testDatabaseDir: URL
  var db: UpdatesDatabase
  var logger: UpdatesLogger
  var config: UpdatesConfig
  var downloader: FileDownloader
  var updatesDir: URL
  var bundle: Bundle
  var baseData: Data
  var patchData: Data
  var expectedPatchedData: Data
  var baseHashBase64: String
  var baseHashHex: String
  var expectedPatchedHash: String
  var updateId: UUID
  var destinationURL: URL
  var launchedUpdate: Update

  init() throws {
    let applicationSupportDir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).last!
    testDatabaseDir = applicationSupportDir.appendingPathComponent("HermesDiffApplicationTests")

    try? FileManager.default.removeItem(atPath: testDatabaseDir.path)

    if !FileManager.default.fileExists(atPath: testDatabaseDir.path) {
      try FileManager.default.createDirectory(atPath: testDatabaseDir.path, withIntermediateDirectories: true)
    }

    db = UpdatesDatabase()

    logger = UpdatesLogger()

    config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://u.expo.dev/11111111-1111-1111-1111-111111111111",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1.0.0",
      UpdatesConfig.EXUpdatesConfigScopeKeyKey: "test-scope"
    ])

    updatesDir = testDatabaseDir.appendingPathComponent("HermesDiff")
    try? FileManager.default.removeItem(at: updatesDir)
    try FileManager.default.createDirectory(at: updatesDir, withIntermediateDirectories: true)

    downloader = FileDownloader(
      config: config,
      logger: logger,
      updatesDirectory: updatesDir,
      database: db
    )

    bundle = Bundle(for: FileDownloaderHermesDiffTestsBundle.self)
    let oldPath = bundle.path(forResource: "old", ofType: "hbc")!
    let newPath = bundle.path(forResource: "new", ofType: "hbc")!
    let patchPath = bundle.path(forResource: "test", ofType: "patch")!

    baseData = try Data(contentsOf: URL(fileURLWithPath: oldPath))
    expectedPatchedData = try Data(contentsOf: URL(fileURLWithPath: newPath))
    patchData = try Data(contentsOf: URL(fileURLWithPath: patchPath))

    baseHashBase64 = UpdatesUtils.base64UrlEncodedSHA256WithData(baseData)
    baseHashHex = UpdatesUtils.hexEncodedSHA256WithData(baseData)
    expectedPatchedHash = UpdatesUtils.base64UrlEncodedSHA256WithData(expectedPatchedData)

    updateId = UUID()
    destinationURL = updatesDir.appendingPathComponent("patched.hbc")

    launchedUpdate = Update(
      manifest: ManifestFactory.manifest(forManifestJSON: [:]),
      config: config,
      database: db,
      updateId: updateId,
      scopeKey: config.scopeKey,
      commitTime: Date(),
      runtimeVersion: config.runtimeVersion,
      keep: true,
      status: UpdateStatus.StatusReady,
      isDevelopmentMode: false,
      assetsFromManifest: [],
      url: config.updateUrl,
      requestHeaders: [:]
    )

    db.databaseQueue.sync {
      try! db.openDatabase(inDirectory: testDatabaseDir, logger: UpdatesLogger())
      try! db.addUpdate(launchedUpdate, config: config)
    }
  }

  deinit {
    db.databaseQueue.sync {
      db.closeDatabase()
    }
    try? FileManager.default.removeItem(at: destinationURL)
    try? FileManager.default.removeItem(at: updatesDir)
    try? FileManager.default.removeItem(atPath: testDatabaseDir.path)
  }

  func createLaunchAsset(expectedHash: String?, useExpectedHash: Bool, contentHashOverride: String?) {
    let asset = UpdateAsset(key: "bundle", type: "hbc")
    asset.isLaunchAsset = true
    asset.filename = "launch-asset.hbc"
    asset.downloadTime = Date()
    asset.contentHash = contentHashOverride ?? baseHashHex
    asset.expectedHash = useExpectedHash ? expectedHash : nil

    let fileURL = updatesDir.appendingPathComponent(asset.filename)
    try? FileManager.default.removeItem(at: fileURL)
    try! baseData.write(to: fileURL, options: .atomic)

    db.databaseQueue.sync {
      try! db.addNewAssets([asset], toUpdateWithId: updateId)
    }
  }

  @Test
  func `applies Hermes diff and writes patched asset`() throws {
    createLaunchAsset(expectedHash: baseHashBase64, useExpectedHash: true, contentHashOverride: nil)
    let requestedUpdate = Update(
      manifest: ManifestFactory.manifest(forManifestJSON: [:]),
      config: config,
      database: db,
      updateId: UUID(),
      scopeKey: config.scopeKey,
      commitTime: Date(),
      runtimeVersion: config.runtimeVersion,
      keep: true,
      status: UpdateStatus.StatusReady,
      isDevelopmentMode: false,
      assetsFromManifest: [],
      url: config.updateUrl,
      requestHeaders: [:]
    )
    let targetAsset = UpdateAsset(key: "new-asset", type: "hbc")
    targetAsset.isLaunchAsset = true

    #expect(FileManager.default.fileExists(atPath: destinationURL.path) == false)

    let (patchedData, patchedHash) = try downloader.applyHermesDiff(
      asset: targetAsset,
      diffData: patchData,
      destinationPath: destinationURL.path,
      launchedUpdate: launchedUpdate,
      requestedUpdate: requestedUpdate,
      expectedBase64URLEncodedSHA256Hash: expectedPatchedHash
    )

    #expect(patchedData == expectedPatchedData)
    #expect(patchedHash == expectedPatchedHash)
    #expect(FileManager.default.fileExists(atPath: destinationURL.path) == true)
    let writtenData = try Data(contentsOf: destinationURL)
    #expect(writtenData == expectedPatchedData)
  }

  @Test
  func `throws when asset is not a launch asset`() {
    let targetAsset = UpdateAsset(key: "new-asset", type: "hbc")
    #expect {
      try downloader.applyHermesDiff(
        asset: targetAsset,
        diffData: patchData,
        destinationPath: destinationURL.path,
        launchedUpdate: launchedUpdate,
        requestedUpdate: nil,
        expectedBase64URLEncodedSHA256Hash: expectedPatchedHash
      )
    } throws: { error in
      guard let diffError = error as? FileDownloader.DiffError,
            case .assetNotLaunch = diffError else {
        return false
      }
      return true
    }
  }

  @Test
  func `throws when launch asset cannot be found`() {
    let targetAsset = UpdateAsset(key: "new-asset", type: "hbc")
    targetAsset.isLaunchAsset = true

    #expect {
      try downloader.applyHermesDiff(
        asset: targetAsset,
        diffData: patchData,
        destinationPath: destinationURL.path,
        launchedUpdate: launchedUpdate,
        requestedUpdate: nil,
        expectedBase64URLEncodedSHA256Hash: expectedPatchedHash
      )
    } throws: { error in
      guard let diffError = error as? FileDownloader.DiffError,
            case .launchAssetNotFound = diffError else {
        return false
      }
      return true
    }
  }

  @Test
  func `throws when launch asset hash mismatches expected value`() {
    let expectedHash = "incorrect-hash"
    createLaunchAsset(expectedHash: expectedHash, useExpectedHash: true, contentHashOverride: nil)

    let targetAsset = UpdateAsset(key: "new-asset", type: "hbc")
    targetAsset.isLaunchAsset = true

    do {
      _ = try downloader.applyHermesDiff(
        asset: targetAsset,
        diffData: patchData,
        destinationPath: destinationURL.path,
        launchedUpdate: launchedUpdate,
        requestedUpdate: nil,
        expectedBase64URLEncodedSHA256Hash: expectedPatchedHash
      )
      Issue.record("Expected to throw DiffError.baseHashMismatch")
    } catch let error as FileDownloader.DiffError {
      if case let .baseHashMismatch(expected, actual) = error {
        #expect(expected == expectedHash)
        #expect(actual == baseHashBase64)
      } else {
        Issue.record("Expected baseHashMismatch, got \(error)")
      }
    } catch {
      Issue.record("Expected FileDownloader.DiffError but got \(error)")
    }

    #expect(FileManager.default.fileExists(atPath: destinationURL.path) == false)
  }

  @Test
  func `throws when stored base asset hex hash mismatches actual asset`() {
    let storedHash = "deadbeef"
    createLaunchAsset(expectedHash: nil, useExpectedHash: false, contentHashOverride: storedHash)

    let targetAsset = UpdateAsset(key: "new-asset", type: "hbc")
    targetAsset.isLaunchAsset = true

    do {
      _ = try downloader.applyHermesDiff(
        asset: targetAsset,
        diffData: patchData,
        destinationPath: destinationURL.path,
        launchedUpdate: launchedUpdate,
        requestedUpdate: nil,
        expectedBase64URLEncodedSHA256Hash: expectedPatchedHash
      )
      Issue.record("Expected to throw DiffError.baseHexHashMismatch")
    } catch let error as FileDownloader.DiffError {
      if case let .baseHexHashMismatch(expected, actual) = error {
        #expect(expected == storedHash)
        #expect(actual == baseHashHex)
      } else {
        Issue.record("Expected baseHexHashMismatch, got \(error)")
      }
    } catch {
      Issue.record("Expected FileDownloader.DiffError but got \(error)")
    }

    #expect(FileManager.default.fileExists(atPath: destinationURL.path) == false)
  }

  @Test
  func `throws when patched asset hash mismatches expected value`() {
    createLaunchAsset(expectedHash: baseHashBase64, useExpectedHash: true, contentHashOverride: nil)

    let targetAsset = UpdateAsset(key: "new-asset", type: "hbc")
    targetAsset.isLaunchAsset = true

    do {
      _ = try downloader.applyHermesDiff(
        asset: targetAsset,
        diffData: patchData,
        destinationPath: destinationURL.path,
        launchedUpdate: launchedUpdate,
        requestedUpdate: nil,
        expectedBase64URLEncodedSHA256Hash: "unexpected"
      )
      Issue.record("Expected to throw DiffError.patchedHashMismatch")
    } catch let error as FileDownloader.DiffError {
      if case let .patchedHashMismatch(expected, actual) = error {
        #expect(expected == "unexpected")
        #expect(actual == expectedPatchedHash)
      } else {
        Issue.record("Expected patchedHashMismatch, got \(error)")
      }
    } catch {
      Issue.record("Expected FileDownloader.DiffError but got \(error)")
    }

    #expect(FileManager.default.fileExists(atPath: destinationURL.path) == false)
  }
}
