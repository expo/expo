// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesTestCore

@testable import ExpoModulesCore

final class SharedObjectRegistrySpec: ExpoSpec {
  override class func spec() {
    let appContext = AppContext.create()
    let runtime = try! appContext.runtime
    let sharedObjectRegistry = appContext.sharedObjectRegistry

    describe("pullNextId") {
      it("returns nextId") {
        let id = sharedObjectRegistry.nextId
        expect(sharedObjectRegistry.pullNextId()) == id
      }
      it("increments nextId") {
        let id = sharedObjectRegistry.nextId
        sharedObjectRegistry.pullNextId()
        expect(sharedObjectRegistry.nextId) == id + 1
      }
      it("is not increasing size") {
        let size = sharedObjectRegistry.size
        sharedObjectRegistry.pullNextId()
        expect(sharedObjectRegistry.size) == size
      }
    }

    describe("add") {
      it("adds using nextId") {
        let nextId = sharedObjectRegistry.nextId
        let id = sharedObjectRegistry.add(native: TestSharedObject(), javaScript: runtime.createObject())
        expect(nextId) == id
      }
      it("is increasing size") {
        let size = sharedObjectRegistry.size
        sharedObjectRegistry.add(native: TestSharedObject(), javaScript: runtime.createObject())
        expect(sharedObjectRegistry.size) == size + 1
      }
      it("assigns id on native object") {
        let nativeObject = TestSharedObject()
        let id = sharedObjectRegistry.add(native: nativeObject, javaScript: runtime.createObject())
        expect(nativeObject.sharedObjectId) == id
      }
      it("assigns the app context on native object") {
        let nativeObject = TestSharedObject()
        sharedObjectRegistry.add(native: nativeObject, javaScript: runtime.createObject())
        expect(nativeObject.appContext) == appContext
      }
      it("assigns id on JS object") {
        let jsObject = runtime.createObject()
        let id = sharedObjectRegistry.add(native: TestSharedObject(), javaScript: jsObject)
        expect(jsObject.hasProperty(sharedObjectIdPropertyName)) == true
        expect(try! jsObject.getProperty(sharedObjectIdPropertyName).asInt()) == id
      }
      it("saves objects pair") {
        let nativeObject = TestSharedObject()
        let jsObject = runtime.createObject()
        let id = sharedObjectRegistry.add(native: nativeObject, javaScript: jsObject)
        let pair = sharedObjectRegistry.get(id)
        expect(pair?.native) === nativeObject
        expect(pair?.javaScript.lock()) == jsObject
      }
    }

    describe("delete") {
      it("deletes objects pair") {
        let id = sharedObjectRegistry.add(native: TestSharedObject(), javaScript: runtime.createObject())
        sharedObjectRegistry.delete(id)
        expect(sharedObjectRegistry.get(id)).to(beNil())
      }
      it("resets id on native object") {
        let nativeObject = TestSharedObject()
        let id = sharedObjectRegistry.add(native: nativeObject, javaScript: runtime.createObject())
        sharedObjectRegistry.delete(id)
        expect(nativeObject.sharedObjectId).toEventually(equal(0))
      }
    }

    describe("toNativeObject") {
      it("returns native object") {
        let nativeObject = TestSharedObject()
        let jsObject = runtime.createObject()
        sharedObjectRegistry.add(native: nativeObject, javaScript: jsObject)
        expect(sharedObjectRegistry.toNativeObject(jsObject)) === nativeObject
      }
      it("returns nil") {
        let jsObject = runtime.createObject()
        expect(sharedObjectRegistry.toNativeObject(jsObject)).to(beNil())
      }
    }

    describe("toJavaScriptObject") {
      it("returns JS object") {
        let nativeObject = TestSharedObject()
        let jsObject = runtime.createObject()
        sharedObjectRegistry.add(native: nativeObject, javaScript: jsObject)
        expect(sharedObjectRegistry.toJavaScriptObject(nativeObject)) == jsObject
      }
      it("returns nil") {
        let nativeObject = TestSharedObject()
        expect(sharedObjectRegistry.toJavaScriptObject(nativeObject)).to(beNil())
      }
    }
  }
}

fileprivate final class TestSharedObject: SharedObject {}
