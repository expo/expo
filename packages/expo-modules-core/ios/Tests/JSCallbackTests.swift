// Copyright 2025-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@Suite("JSCallback")
struct JSCallbackTests {

  @Suite("JavaScript")
  @JavaScriptActor
  struct JavaScriptTests {
    let appContext: AppContext
    var runtime: ExpoRuntime {
      get throws {
        try appContext.runtime
      }
    }

    struct UserRecord: Record {
      @Field var name: String = ""
      @Field var age: Int = 0
    }

    enum Status: String, Enumerable {
      case active
      case inactive
    }

    init() {
      appContext = AppContext.create()

      appContext.moduleRegistry.register(holder: mockModuleHolder(appContext) {
        Name("TestModule")

        Function("callWithInt") { (callback: JSCallback) in
          callback(42)
        }

        Function("callWithString") { (callback: JSCallback) in
          callback("hello from native")
        }

        Function("callWithDouble") { (callback: JSCallback) in
          callback(3.14)
        }

        Function("callWithBool") { (callback: JSCallback) in
          callback(true)
        }

        Function("callWithDict") { (callback: JSCallback) in
          callback(["name": "expo", "version": 56])
        }

        Function("callNoArgs") { (callback: JSCallback) in
          callback()
        }

        Function("callMultiple") { (callback: JSCallback) in
          for i in 0...2 {
            callback(i + 1)
          }
        }

        Function("callWithPrefix") { (prefix: String, callback: JSCallback) in
          callback("\(prefix) world")
        }

        AsyncFunction("asyncCallWithString") { (callback: JSCallback) in
          callback("async result")
        }

        Function("callWithRecord") { (callback: JSCallback) in
          let user = UserRecord()
          user.name = "John"
          user.age = 30
          callback(user)
        }

        Function("callWithEnum") { (callback: JSCallback) in
          callback(Status.active)
        }

        Function("callWithRecordArray") { (callback: JSCallback) in
          let alice = UserRecord()
          alice.name = "Alice"
          alice.age = 25
          let bob = UserRecord()
          bob.name = "Bob"
          bob.age = 35
          callback([alice, bob])
        }
      })
    }

    @Test
    func callbackWithInt() async throws {
      try runtime.eval("expo.modules.TestModule.callWithInt((v) => { globalThis.__cbInt = v })")
      try await waitUntil(timeout: 2.0) { safeBoolEval("globalThis.__cbInt !== undefined") }
      let value = try runtime.eval("globalThis.__cbInt")
      #expect(value.getInt() == 42)
    }

    @Test
    func callbackWithString() async throws {
      try runtime.eval("expo.modules.TestModule.callWithString((v) => { globalThis.__cbStr = v })")
      try await waitUntil(timeout: 2.0) { safeBoolEval("globalThis.__cbStr !== undefined") }
      let value = try runtime.eval("globalThis.__cbStr")
      #expect(value.getString() == "hello from native")
    }

    @Test
    func callbackWithDouble() async throws {
      try runtime.eval("expo.modules.TestModule.callWithDouble((v) => { globalThis.__cbDbl = v })")
      try await waitUntil(timeout: 2.0) { safeBoolEval("globalThis.__cbDbl !== undefined") }
      let value = try runtime.eval("globalThis.__cbDbl")
      #expect(try value.asDouble() == 3.14)
    }

    @Test
    func callbackWithBool() async throws {
      try runtime.eval("expo.modules.TestModule.callWithBool((v) => { globalThis.__cbBool = v })")
      try await waitUntil(timeout: 2.0) { safeBoolEval("globalThis.__cbBool !== undefined") }
      let value = try runtime.eval("globalThis.__cbBool")
      #expect(value.getBool() == true)
    }

    @Test
    func callbackWithDict() async throws {
      try runtime.eval("expo.modules.TestModule.callWithDict((v) => { globalThis.__cbDict = v })")
      try await waitUntil(timeout: 2.0) { safeBoolEval("globalThis.__cbDict !== undefined") }
      let name = try runtime.eval("globalThis.__cbDict.name")
      let version = try runtime.eval("globalThis.__cbDict.version")
      #expect(name.getString() == "expo")
      #expect(version.getInt() == 56)
    }

    @Test
    func callbackNoArgs() async throws {
      try runtime.eval("expo.modules.TestModule.callNoArgs(() => { globalThis.__cbNoArgs = true })")
      try await waitUntil(timeout: 2.0) { safeBoolEval("globalThis.__cbNoArgs === true") }
      let value = try runtime.eval("globalThis.__cbNoArgs")
      #expect(value.getBool() == true)
    }

    @Test
    func callbackMultipleTimes() async throws {
      try runtime.eval("""
        globalThis.__cbMulti = [];
        expo.modules.TestModule.callMultiple((v) => { globalThis.__cbMulti.push(v) })
      """)
      try await waitUntil(timeout: 2.0) { safeBoolEval("globalThis.__cbMulti.length === 3") }

      let first = try runtime.eval("globalThis.__cbMulti[0]")
      let second = try runtime.eval("globalThis.__cbMulti[1]")
      let third = try runtime.eval("globalThis.__cbMulti[2]")
      #expect(first.getInt() == 1)
      #expect(second.getInt() == 2)
      #expect(third.getInt() == 3)
    }

    @Test
    func callbackAlongsideOtherArgs() async throws {
      try runtime.eval("expo.modules.TestModule.callWithPrefix('hello', (v) => { globalThis.__cbArgs = v })")
      try await waitUntil(timeout: 2.0) { safeBoolEval("globalThis.__cbArgs !== undefined") }
      let value = try runtime.eval("globalThis.__cbArgs")
      #expect(value.getString() == "hello world")
    }

    @Test
    func callbackInAsyncFunction() async throws {
      try runtime.eval("expo.modules.TestModule.asyncCallWithString((v) => { globalThis.__cbAsync = v })")
      try await waitUntil(timeout: 2.0) { safeBoolEval("globalThis.__cbAsync !== undefined") }
      let value = try runtime.eval("globalThis.__cbAsync")
      #expect(value.getString() == "async result")
    }

    @Test
    func callbackWithRecord() async throws {
      try runtime.eval("expo.modules.TestModule.callWithRecord((v) => { globalThis.__cbRecord = v })")
      try await waitUntil(timeout: 2.0) { safeBoolEval("globalThis.__cbRecord !== undefined") }
      let name = try runtime.eval("globalThis.__cbRecord.name")
      let age = try runtime.eval("globalThis.__cbRecord.age")
      #expect(name.getString() == "John")
      #expect(age.getInt() == 30)
    }

    @Test
    func callbackWithEnum() async throws {
      try runtime.eval("expo.modules.TestModule.callWithEnum((v) => { globalThis.__cbEnum = v })")
      try await waitUntil(timeout: 2.0) { safeBoolEval("globalThis.__cbEnum !== undefined") }
      let value = try runtime.eval("globalThis.__cbEnum")
      #expect(value.getString() == "active")
    }

    @Test
    func callbackWithArrayOfRecords() async throws {
      try runtime.eval("expo.modules.TestModule.callWithRecordArray((v) => { globalThis.__cbRecords = v })")
      try await waitUntil(timeout: 2.0) { safeBoolEval("globalThis.__cbRecords !== undefined") }
      let length = try runtime.eval("globalThis.__cbRecords.length")
      #expect(length.getInt() == 2)

      let firstName = try runtime.eval("globalThis.__cbRecords[0].name")
      let secondName = try runtime.eval("globalThis.__cbRecords[1].name")
      #expect(firstName.getString() == "Alice")
      #expect(secondName.getString() == "Bob")
    }

    private func safeBoolEval(_ js: String) -> Bool {
      var result = false
      do {
        try EXUtilities.catchException {
          guard let jsResult = try? self.runtime.eval(js) else {
            return
          }
          result = jsResult.getBool()
        }
      } catch {
        return false
      }
      return result
    }

    private func waitUntil(timeout: TimeInterval, condition: @escaping () -> Bool) async throws {
      let start = Date()
      while !condition() {
        if Date().timeIntervalSince(start) > timeout {
          throw TestError.timeout
        }
        try await Task.sleep(nanoseconds: 50_000_000)
      }
    }
  }
}

private enum TestError: Error {
  case timeout
}
