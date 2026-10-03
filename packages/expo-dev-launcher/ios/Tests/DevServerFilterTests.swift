// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest

@testable import EXDevLauncher

class DevServerFilterTests: XCTestCase {
  private func server(
    _ url: String,
    slug: String? = nil,
    bundleIdentifier: String? = nil,
    username: String? = nil
  ) -> DevServer {
    return DevServer(
      url: url,
      description: url,
      source: "local",
      slug: slug,
      bundleIdentifier: bundleIdentifier,
      username: username
    )
  }

  private func settings(
    bundleIdentifier: Bool = false,
    username: Bool = false,
    slug: String = ""
  ) -> DevServerFilterSettings {
    return DevServerFilterSettings(
      filterByBundleIdentifier: bundleIdentifier,
      filterByUsername: username,
      slug: slug
    )
  }

  func testAllFiltersOffKeepsEveryServer() {
    let servers = [
      server("http://10.0.0.1:8081", bundleIdentifier: "dev.expo.mine"),
      server("http://10.0.0.2:8081", bundleIdentifier: "dev.expo.theirs")
    ]

    let result = DevServerFilter.apply(
      servers,
      settings: .disabled,
      bundleIdentifier: "dev.expo.mine",
      username: "alanjhughes"
    )

    XCTAssertEqual(result.map(\.url), servers.map(\.url))
  }

  func testBundleIdentifierFilterKeepsOnlyMatchingServers() {
    let servers = [
      server("http://10.0.0.1:8081", bundleIdentifier: "dev.expo.mine"),
      server("http://10.0.0.2:8081", bundleIdentifier: "dev.expo.theirs")
    ]

    let result = DevServerFilter.apply(
      servers,
      settings: settings(bundleIdentifier: true),
      bundleIdentifier: "dev.expo.mine",
      username: nil
    )

    XCTAssertEqual(result.map(\.url), ["http://10.0.0.1:8081"])
  }

  func testBundleIdentifierFilterDropsServersThatAdvertiseNone() {
    let servers = [server("http://10.0.0.1:8081", bundleIdentifier: nil)]

    let result = DevServerFilter.apply(
      servers,
      settings: settings(bundleIdentifier: true),
      bundleIdentifier: "dev.expo.mine",
      username: nil
    )

    XCTAssertTrue(result.isEmpty)
  }

  func testBundleIdentifierFilterIsSkippedWithoutAHostIdentifier() {
    let servers = [
      server("http://10.0.0.1:8081", bundleIdentifier: "dev.expo.mine"),
      server("http://10.0.0.2:8081", bundleIdentifier: "dev.expo.theirs")
    ]

    let result = DevServerFilter.apply(
      servers,
      settings: settings(bundleIdentifier: true),
      bundleIdentifier: nil,
      username: nil
    )

    XCTAssertEqual(result.count, 2)
  }

  func testUsernameFilterKeepsOnlyMatchingServers() {
    let servers = [
      server("http://10.0.0.1:8081", username: "alanjhughes"),
      server("http://10.0.0.2:8081", username: "keith")
    ]

    let result = DevServerFilter.apply(
      servers,
      settings: settings(username: true),
      bundleIdentifier: nil,
      username: "alanjhughes"
    )

    XCTAssertEqual(result.map(\.url), ["http://10.0.0.1:8081"])
  }

  func testUsernameFilterIsSkippedWhenLoggedOut() {
    let servers = [
      server("http://10.0.0.1:8081", username: "alanjhughes"),
      server("http://10.0.0.2:8081", username: "keith")
    ]

    let result = DevServerFilter.apply(
      servers,
      settings: settings(username: true),
      bundleIdentifier: nil,
      username: nil
    )

    XCTAssertEqual(result.count, 2)
  }

  func testSlugFilterKeepsOnlyMatchingServers() {
    let servers = [
      server("http://10.0.0.1:8081", slug: "my-app"),
      server("http://10.0.0.2:8081", slug: "other-app")
    ]

    let result = DevServerFilter.apply(
      servers,
      settings: settings(slug: "my-app"),
      bundleIdentifier: nil,
      username: nil
    )

    XCTAssertEqual(result.map(\.url), ["http://10.0.0.1:8081"])
  }

  func testWhitespaceOnlySlugDisablesTheSlugFilter() {
    let servers = [
      server("http://10.0.0.1:8081", slug: "my-app"),
      server("http://10.0.0.2:8081", slug: "other-app")
    ]

    let result = DevServerFilter.apply(
      servers,
      settings: settings(slug: "   "),
      bundleIdentifier: nil,
      username: nil
    )

    XCTAssertEqual(result.count, 2)
  }

  func testSlugFilterIgnoresSurroundingWhitespace() {
    let servers = [server("http://10.0.0.1:8081", slug: "my-app")]

    let result = DevServerFilter.apply(
      servers,
      settings: settings(slug: " my-app "),
      bundleIdentifier: nil,
      username: nil
    )

    XCTAssertEqual(result.count, 1)
  }

  func testFiltersComposeCumulatively() {
    let servers = [
      server(
        "http://10.0.0.1:8081",
        slug: "my-app",
        bundleIdentifier: "dev.expo.mine",
        username: "alanjhughes"
      ),
      server(
        "http://10.0.0.2:8081",
        slug: "my-app",
        bundleIdentifier: "dev.expo.mine",
        username: "keith"
      ),
      server(
        "http://10.0.0.3:8081",
        slug: "other-app",
        bundleIdentifier: "dev.expo.mine",
        username: "alanjhughes"
      )
    ]

    let result = DevServerFilter.apply(
      servers,
      settings: settings(bundleIdentifier: true, username: true, slug: "my-app"),
      bundleIdentifier: "dev.expo.mine",
      username: "alanjhughes"
    )

    XCTAssertEqual(result.map(\.url), ["http://10.0.0.1:8081"])
  }
}
