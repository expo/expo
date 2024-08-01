//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

class StringListSpec : ExpoSpec {
  override class func spec() {
    describe("serialization") {
      it("empty list") {
        expect(StringList(value: []).serialize()) == ""
      }

      it("basic list") {
        expect(try StringList(value: [StringItem(value: "10"), StringItem(value: "20")]).serialize()) == "\"10\", \"20\""
      }
    }
  }
}
