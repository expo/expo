/**
 Contains specialized functions that execute fatal errors that terminate the program and print the message to the console.
 */
internal struct FatalError {
  /**
   Signals that a function or one of its case is not implemented (intentionally or not).
   */
  internal static func unimplemented() -> Never {
    fatalError("Unimplemented")
  }

  /**
   Stops program execution when the JS runtime is not available but required to proceed.
   */
  internal static func runtimeLost() -> Never {
    fatalError("The JavaScript runtime has been deallocated")
  }

  /**
   Stops program execution when trying to access buffer's elements out of its range.
   */
  internal static func valuesBufferIndexOutRange(index: Int, capacity: Int) -> Never {
    fatalError("Index \(index) is out of range of values buffer capacity \(capacity), valid range is 0..<\(capacity)")
  }

  /**
   Stops program execution when trying to represent a `JavaScriptValuesBuffer` as a single JS value.
   */
  internal static func valuesBufferNotRepresentable() -> Never {
    fatalError("JavaScript values buffer cannot be represented as a single value")
  }

  /**
   Stops program execution when the Swift setter trampoline runs for a host object that
   was created with `set: nil`. The C++ `HostObjectCallbacks::set` is supposed to throw a
   `jsi::JSError` for read-only host objects without re-entering Swift, so reaching this
   means that contract has drifted — check its null-setter short-circuit.
   */
  internal static func readOnlyHostObjectSetterInvoked() -> Never {
    fatalError(
      "createHostObject setter trampoline ran despite set: nil — HostObjectCallbacks::set should throw a jsi::JSError for read-only host objects without re-entering Swift. "
      + "Check that its null-setter short-circuit is still in place."
    )
  }
}
