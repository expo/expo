// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation
import Testing
@testable import Expo

@Suite
struct ExpoBundleConfigurationTests {
  @Test(arguments: [
    ("https://abc.on.expo.app/index.bundle?platform=ios", "abc.on.expo.app:443"),
    ("https://example.com:8443/index.bundle", "example.com:8443"),
    ("http://192.168.1.2:8081/index.bundle", "192.168.1.2:8081"),
    ("http://localhost/index.bundle", "localhost"),
    ("http://[::1]:8081/index.bundle", "[::1]:8081"),
  ])
  func `packager host keeps the port the bundle URL implies`(bundleURL: String, packagerHost: String) {
    let configuration = ExpoBundleConfiguration(bundleURL: URL(string: bundleURL)!)
    #expect(configuration.getPackagerServerHost() == packagerHost)
  }
}
