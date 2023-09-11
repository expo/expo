// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesTestCore

@testable import ExpoModulesCore

final class SharedObjectRegistrySpec: ExpoSpec {
  override func spec() {
    let appContext = AppContext.create()
    let runtime = try! appContext.runtime

    describe("pullNextId") {
      it("returns nextId") {
        let id = SharedObjectRegistry.nextId
        expect(SharedObjectRegistry.pullNextId()) == id
      }
      it("increments nextId") {
        let id = SharedObjectRegistry.nextId
        SharedObjectRegistry.pullNextId()
        expect(SharedObjectRegistry.nextId) == id + 1
      }
      it("is not increasing size") {
        let size = SharedObjectRegistry.size
        SharedObjectRegistry.pullNextId()
        expect(SharedObjectRegistry.size) == size
      }
    }

    describe("add") {
      it("adds using nextId") {
        let nextId = SharedObjectRegistry.nextId
        let id = SharedObjectRegistry.add(native: TestSharedObject(), javaScript: runtime.createObject())
        expect(nextId) == id
      }
      it("is increasing size") {
        let size = SharedObjectRegistry.size
        SharedObjectRegistry.add(native: TestSharedObject(), javaScript: runtime.createObject())
        expect(SharedObjectRegistry.size) == size + 1
      }
      it("assigns id on native object") {
        let nativeObject = TestSharedObject()
        let id = SharedObjectRegistry.add(native: nativeObject, javaScript: runtime.createObject())
        expect(nativeObject.sharedObjectId) == id
      }
      it("assigns id on JS object") {
        let jsObject = runtime.createObject()
        let id = SharedObjectRegistry.add(native: TestSharedObject(), javaScript: jsObject)
        expect(jsObject.hasProperty(sharedObjectIdPropertyName)) == true
        expect(try! jsObject.getProperty(sharedObjectIdPropertyName).asInt()) == id
      }
      it("saves objects pair") {
        let nativeObject = TestSharedObject()
        let jsObject = runtime.createObject()
        let id = SharedObjectRegistry.add(native: nativeObject, javaScript: jsObject)
        let pair = SharedObjectRegistry.get(id)
        expect(pair?.native) === nativeObject
        expect(pair?.javaScript.lock()) == jsObject
      }
    }

    describe("delete") {
      it("deletes objects pair") {
        let id = SharedObjectRegistry.add(native: TestSharedObject(), javaScript: runtime.createObject())
        SharedObjectRegistry.delete(id)
        expect(SharedObjectRegistry.get(id)).to(beNil())
      }
      it("resets id on native object") {
        let nativeObject = TestSharedObject()
        let id = SharedObjectRegistry.add(native: nativeObject, javaScript: runtime.createObject())
        SharedObjectRegistry.delete(id)
        expect(nativeObject.sharedObjectId) == 0
      }
      it("resets id on JS object") {
        let jsObject = runtime.createObject()
        let id = SharedObjectRegistry.add(native: TestSharedObject(), javaScript: jsObject)
        SharedObjectRegistry.delete(id)
        expect(try! jsObject.getProperty(sharedObjectIdPropertyName).asInt()) == 0
      }
    }

    describe("toNativeObject") {
      it("returns native object") {
        let nativeObject = TestSharedObject()
        let jsObject = runtime.createObject()
        SharedObjectRegistry.add(native: nativeObject, javaScript: jsObject)
        expect(SharedObjectRegistry.toNativeObject(jsObject)) === nativeObject
      }
      it("returns nil") {
        let jsObject = runtime.createObject()
        expect(SharedObjectRegistry.toNativeObject(jsObject)).to(beNil())
      }
    }

    describe("toJavaScriptObject") {
      it("returns JS object") {
        let nativeObject = TestSharedObject()
        let jsObject = runtime.createObject()
        SharedObjectRegistry.add(native: nativeObject, javaScript: jsObject)
        expect(SharedObjectRegistry.toJavaScriptObject(nativeObject)) == jsObject
      }
      it("returns nil") {
        let nativeObject = TestSharedObject()
        expect(SharedObjectRegistry.toJavaScriptObject(nativeObject)).to(beNil())
      }
    }
  }
}

fileprivate final class TestSharedObject: SharedObject {}
