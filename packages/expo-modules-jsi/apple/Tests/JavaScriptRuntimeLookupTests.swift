@_spi(Internal) import ExpoModulesJSI
import Testing

@Suite
@JavaScriptActor
struct JavaScriptRuntimeLookupTests {
  @Test
  func `finds a runtime by the address of its jsi runtime`() {
    let runtime = JavaScriptRuntime()

    runtime.withUnsafePointee { pointer in
      #expect(JavaScriptRuntime.for(unsafePointer: pointer) === runtime)
      // The second time, it gives the remembered runtime.
      #expect(JavaScriptRuntime.for(unsafePointer: pointer) === runtime)
    }
  }

  @Test
  func `finds each of several runtimes`() {
    let first = JavaScriptRuntime()
    let second = JavaScriptRuntime()

    first.withUnsafePointee { firstPointer in
      second.withUnsafePointee { secondPointer in
        #expect(JavaScriptRuntime.for(unsafePointer: firstPointer) === first)
        #expect(JavaScriptRuntime.for(unsafePointer: secondPointer) === second)
        #expect(JavaScriptRuntime.for(unsafePointer: firstPointer) === first)
      }
    }
  }

  @Test
  func `returns nil for an address without a runtime`() {
    var value = 0

    withUnsafePointer(to: &value) { pointer in
      #expect(JavaScriptRuntime.for(unsafePointer: UnsafeRawPointer(pointer)) == nil)
    }
  }

  @Test
  func `forgets the remembered runtime after it is deallocated`() {
    let owner = JavaScriptRuntime()

    owner.withUnsafePointee { pointer in
      #expect(JavaScriptRuntime.for(unsafePointer: pointer) === owner)

      // A second wrapper of the same engine runtime, which it doesn't own, so releasing it leaves the
      // engine runtime alive at the same address.
      var adopted: JavaScriptRuntime? = JavaScriptRuntime(unsafePointer: pointer)
      #expect(JavaScriptRuntime.for(unsafePointer: pointer) === adopted)

      adopted = nil
      // The owner is still registered for the address, so the lookup falls back to it.
      #expect(JavaScriptRuntime.for(unsafePointer: pointer) === owner)
    }
  }
}
