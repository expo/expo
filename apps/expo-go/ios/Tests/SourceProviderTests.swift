// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class SourceProviderTests: XCTestCase {
  // MARK: - Selection

  func testSnackParamsSelectSnackProvider() {
    let provider = SourceProviderSelector.provider(
      manifestURL: URL(string: "exp://exp.host/@user/proj?snack=abc&snack-channel=ch1"),
      bundleURL: URL(string: "https://exp.host/bundle.js"),
      loadBundleData: { nil }
    )
    XCTAssertTrue(provider is SnackSourceProvider)
  }

  func testDevServerBundleSelectsMetroProvider() {
    let provider = SourceProviderSelector.provider(
      manifestURL: URL(string: "exp://192.168.1.5:8081"),
      bundleURL: URL(string: "http://192.168.1.5:8081/index.bundle?platform=ios"),
      loadBundleData: { nil }
    )
    XCTAssertTrue(provider is MetroSourceProvider)
  }

  func testEASCDNBundleSelectsInlineProvider() {
    let provider = SourceProviderSelector.provider(
      manifestURL: URL(string: "https://u.expo.dev/project-id"),
      bundleURL: URL(string: "https://assets.eascdn.net/abc123"),
      loadBundleData: { nil }
    )
    XCTAssertTrue(provider is BundleSourceMapProvider)
  }

  func testFileBundleSelectsInlineProvider() {
    let provider = SourceProviderSelector.provider(
      manifestURL: URL(string: "https://u.expo.dev/project-id"),
      bundleURL: URL(string: "file:///var/app/bundle.js"),
      loadBundleData: { nil }
    )
    XCTAssertTrue(provider is BundleSourceMapProvider)
  }

  // MARK: - Inline sourcemap extraction

  private func bundleData(sources: [(String, String)]) -> Data {
    let map: [String: Any] = [
      "version": 3,
      "sources": sources.map(\.0),
      "sourcesContent": sources.map(\.1),
      "mappings": "",
      "names": [] as [String]
    ]
    let base64 = try! JSONSerialization.data(withJSONObject: map).base64EncodedString()
    let bundle = "console.log('app');\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,\(base64)\n"
    return Data(bundle.utf8)
  }

  func testInlineSourceMapExtraction() async throws {
    let data = bundleData(sources: [("App.js", "export default 1")])
    let provider = BundleSourceMapProvider(loadBundleData: { data })
    let tree = try await provider.loadSource()
    XCTAssertEqual(tree.contents(forPath: "App.js"), "export default 1")
  }

  func testMissingInlineSourceMapThrows() async {
    let provider = BundleSourceMapProvider(loadBundleData: { Data("no map here".utf8) })
    do {
      _ = try await provider.loadSource()
      XCTFail("expected error")
    } catch let error as SourceMapError {
      guard case .noSourceMapFound = error else { return XCTFail("wrong error: \(error)") }
    } catch {
      XCTFail("wrong error type: \(error)")
    }
  }

  func testCorruptBase64Throws() async {
    let bundle = "code;\n//# sourceMappingURL=data:application/json;base64,!!!not-base64!!!\n"
    let provider = BundleSourceMapProvider(loadBundleData: { Data(bundle.utf8) })
    do {
      _ = try await provider.loadSource()
      XCTFail("expected error")
    } catch let error as SourceMapError {
      guard case .invalidInlineSourceMap = error else { return XCTFail("wrong error: \(error)") }
    } catch {
      XCTFail("wrong error type: \(error)")
    }
  }

  func testNilBundleDataThrows() async {
    let provider = BundleSourceMapProvider(loadBundleData: { nil })
    do {
      _ = try await provider.loadSource()
      XCTFail("expected error")
    } catch {
      // any SourceMapError is acceptable; the point is a clean throw
    }
  }

  // MARK: - Metro URL construction

  func testMetroMapURL() {
    let provider = MetroSourceProvider(bundleURL: URL(string: "http://localhost:8081/index.bundle?platform=ios&dev=true")!)
    XCTAssertEqual(provider.sourceMapURL?.absoluteString, "http://localhost:8081/index.map?platform=ios&dev=true")
  }
}
