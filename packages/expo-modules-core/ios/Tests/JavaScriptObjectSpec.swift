// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesTestCore

@testable import ExpoModulesCore

final class JavaScriptObjectSpec: ExpoSpec {
  override class func spec() {
    let runtime = JavaScriptRuntime()
    var object: JavaScriptObject?

    let key = "expo"
    let value1 = "💙"
    let value2 = "💛"

    beforeEach {
      object = runtime.createObject()
    }

    describe("hasProperty") {
      it("returns false when the property is missing") {
        expect(object?.hasProperty(key)) == false
      }

      it("returns true when the property exists") {
        object?.setProperty(key, value: value1)
        expect(object?.hasProperty(key)) == true
      }

      it("returns true when the property is explicitly set to undefined") {
        object?.setProperty(key, value: nil)
        expect(object?.hasProperty(key)) == true
        expect(object?.getProperty(key).isUndefined()) == true
      }
    }

    describe("getProperty") {
      it("returns correct value") {
        object?.setProperty(key, value: value1)
        expect(try! object?.getProperty(key).asString()) == value1
      }

      it("returns undefined") {
        expect(object?.getProperty("bar").isUndefined()) == true
      }
    }

    describe("setProperty") {
      it("sets") {
        object?.setProperty(key, value: value1)
        expect(try! object?.getProperty(key).asString()) == value1
      }

      it("overrides") {
        object?.setProperty(key, value: value1)
        object?.setProperty(key, value: value2)
        expect(try! object?.getProperty(key).asString()) == value2
      }

      it("unsets") {
        object?.setProperty(key, value: nil)
        expect(object?.getProperty(key).isUndefined()) == true
      }
    }

    describe("defineProperty") {
      it("defines non-enumerable property") {
        object?.defineProperty(key, value: value1, options: [])
        expect(try! object?.getProperty(key).asString()) == value1
        expect(object?.getPropertyNames()).notTo(contain(key))
      }

      it("defines enumerable property") {
        // When the property is enumerable, it is listed in the property names
        object?.defineProperty(key, value: value1, options: .enumerable)
        expect(try! object?.getProperty(key).asString()) == value1
        expect(object?.getPropertyNames()).to(contain(key))
      }

      it("defines configurable property") {
        // Configurable allows to redefine the property
        object?.defineProperty(key, value: value1, options: .configurable)
        expect(try! object?.getProperty(key).asString()) == value1
        object?.defineProperty(key, value: value2, options: [])
        expect(try! object?.getProperty(key).asString()) == value2
      }

      it("defines writable property") {
        // Writable allows changing the property
        object?.defineProperty(key, value: value1, options: .writable)
        expect(try! object?.getProperty(key).asString()) == value1
        object?.setProperty(key, value: value2)
        expect(try! object?.getProperty(key).asString()) == value2
      }
    }
  }
}
