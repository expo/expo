import Testing

@testable import ExpoModulesCore

@Suite
struct JavaScriptActorTests {
  @Test
  func `awaits in nonisolated context`() async {
    #expect(await isolatedFunction() == "func")
    #expect(await IsolatedStruct().value == "struct")
  }

  @Test
  func `assumeIsolated enters isolation`() {
    JavaScriptActor.assumeIsolated {
      #expect(isolatedFunction() == "func")
      #expect(IsolatedStruct().value == "struct")
    }
  }

  @Test
  func `assumeIsolated returns value from isolated block`() {
    let result: String = JavaScriptActor.assumeIsolated {
      return "result"
    }
    #expect(result == "result")
  }

  @Test
  func `assumeIsolated rethrows error from isolated block`() {
    #expect(throws: NSError.self) {
      try JavaScriptActor.assumeIsolated {
        throw NSError(domain: "throw from isolation", code: 0)
      }
    }
  }
}

@JavaScriptActor
func isolatedFunction() -> String {
  return "func"
}

@JavaScriptActor
struct IsolatedStruct {
  let value: String = "struct"
}
