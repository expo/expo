// Copyright 2025-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesJSI

@Suite
struct JavaScriptRuntimeTests {
  @Test
  func `initializes`() {
    _ = JavaScriptRuntime()
  }

  @Test
  func `has global object`() async throws {
    let runtime = JavaScriptRuntime()
    try #require(runtime.global())
  }

  // TODO: Move tests from ExpoModulesCore/JavaScriptRuntimeSpec and add more
}
