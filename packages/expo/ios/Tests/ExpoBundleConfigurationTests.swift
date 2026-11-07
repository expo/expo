// Copyright 2026-present 650 Industries. All rights reserved.

import React
import Testing
@testable import Expo

#if os(iOS) || os(tvOS)

@Suite
struct ExpoBundleConfigurationTests {
  private func packagerServerHost(for bundleURL: String) -> String {
    ExpoBundleConfiguration.configuration(bundleURL: URL(string: bundleURL)).getPackagerServerHost()
  }

  @Test
  func `uses port 443 for an https URL without a port`() {
    #expect(packagerServerHost(for: "https://dev.example.com/index.bundle") == "dev.example.com:443")
  }

  @Test
  func `uses port 80 for an http URL without a port`() {
    #expect(packagerServerHost(for: "http://dev.example.com/index.bundle") == "dev.example.com:80")
  }

  @Test
  func `brackets an IPv6 host when the URL has no port`() {
    #expect(packagerServerHost(for: "http://[::1]/index.bundle") == "[::1]:80")
  }
}

#endif
