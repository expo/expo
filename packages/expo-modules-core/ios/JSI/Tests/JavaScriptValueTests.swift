// Copyright 2025-present 650 Industries. All rights reserved.

import Testing
@testable import ExpoModulesJSI

@Suite
struct JavaScriptValueTests {
  @Test
  func `static undefined`() {
    #expect(JavaScriptValue.undefined.isUndefined() == true)
    #expect(JavaScriptValue.undefined.isNull() == false)
    #expect(JavaScriptValue.undefined.isString() == false)
  }

  @Test
  func `static null`() {
    #expect(JavaScriptValue.null.isUndefined() == false)
    #expect(JavaScriptValue.null.isNull() == true)
    #expect(JavaScriptValue.null.isString() == false)
  }

  // TODO: Move tests from ExpoModulesCore/JavaScriptValueSpec and add more
}
