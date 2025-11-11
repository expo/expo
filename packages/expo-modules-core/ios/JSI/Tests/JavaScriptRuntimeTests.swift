// Copyright 2025-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesJSI

@Suite
struct JavaScriptRuntimeTests {
  @Test
  func `initializes`() {
    // Just check it does not crash
    let runtime = JavaScriptRuntime()
    runtime.global()
  }

  // TODO: Move tests from ExpoModulesCore/JavaScriptRuntimeSpec and add more
}
