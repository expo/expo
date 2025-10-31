// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesTestCore

@testable import ExpoModulesJSI

final class JavaScriptValueSpec: ExpoSpec {
  override class func spec() {
    describe("static undefined") {
      it("is undefined") {
        expect(JavaScriptValue.undefined.isUndefined()) == true
        expect(JavaScriptValue.undefined.isNull()) == false
        expect(JavaScriptValue.undefined.isString()) == false
      }
    }
    describe("static null") {
      it("is null") {
        expect(JavaScriptValue.null.isUndefined()) == false
        expect(JavaScriptValue.null.isNull()) == true
        expect(JavaScriptValue.null.isString()) == false
      }
    }

    // TODO: Move tests from ExpoModulesCore/JavaScriptValueSpec and add more
  }
}
