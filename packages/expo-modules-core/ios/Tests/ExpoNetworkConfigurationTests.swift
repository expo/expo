// Copyright 2025-present 650 Industries. All rights reserved.

import Testing
import Foundation

@testable import ExpoModulesCore

// The hooks are process-wide static state, so run the cases serially and reset after each.
@Suite("ExpoNetworkConfiguration", .serialized)
struct ExpoNetworkConfigurationTests {
  private func resetHooks() {
    ExpoNetworkConfiguration.setURLSessionConfigurationProvider(nil)
    ExpoNetworkConfiguration.setURLRequestModifier(nil)
  }

  @Test
  func `falls back to the default configuration when no provider is registered`() {
    resetHooks()
    let fallback = URLSessionConfiguration.default
    let resolved = ExpoNetworkConfiguration.configuration(default: fallback)
    #expect(resolved === fallback)
  }

  @Test
  func `uses the configuration from the registered provider`() {
    resetHooks()
    let custom = URLSessionConfiguration.ephemeral
    ExpoNetworkConfiguration.setURLSessionConfigurationProvider { custom }

    let resolved = ExpoNetworkConfiguration.configuration(default: .default)
    #expect(resolved === custom)
    resetHooks()
  }

  @Test
  func `falls back to the default when the provider returns nil`() {
    resetHooks()
    let fallback = URLSessionConfiguration.default
    ExpoNetworkConfiguration.setURLSessionConfigurationProvider { nil }

    let resolved = ExpoNetworkConfiguration.configuration(default: fallback)
    #expect(resolved === fallback)
    resetHooks()
  }

  @Test
  func `returns the request unchanged when no modifier is registered`() {
    resetHooks()
    let request = URLRequest(url: URL(string: "https://example.com")!)
    let modified = ExpoNetworkConfiguration.modifiedRequest(request)
    #expect(modified == request)
  }

  @Test
  func `applies the registered request modifier`() {
    resetHooks()
    ExpoNetworkConfiguration.setURLRequestModifier { request in
      var copy = request
      copy.setValue("bar", forHTTPHeaderField: "X-Foo")
      return copy
    }

    let request = URLRequest(url: URL(string: "https://example.com")!)
    let modified = ExpoNetworkConfiguration.modifiedRequest(request)
    #expect(modified.value(forHTTPHeaderField: "X-Foo") == "bar")
    resetHooks()
  }

  @Test
  func `clearing the modifier restores pass-through behavior`() {
    resetHooks()
    ExpoNetworkConfiguration.setURLRequestModifier { request in
      var copy = request
      copy.setValue("bar", forHTTPHeaderField: "X-Foo")
      return copy
    }
    ExpoNetworkConfiguration.setURLRequestModifier(nil)

    let request = URLRequest(url: URL(string: "https://example.com")!)
    let modified = ExpoNetworkConfiguration.modifiedRequest(request)
    #expect(modified.value(forHTTPHeaderField: "X-Foo") == nil)
  }
}
