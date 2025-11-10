// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesTestCore

@testable import ExpoModulesJSI

final class JavaScriptRuntimeSpec: ExpoSpec {
  override class func spec() {
    let runtime = JavaScriptRuntime()

    describe("global") {
      it("is not nil") {
        expect(runtime.global()) !== nil
      }
    }

    // TODO: Move tests from ExpoModulesCore/JavaScriptRuntimeSpec and add more
  }
}
