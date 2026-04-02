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
   Stops program execution when the already released native state is used.
   */
  internal static func nativeStateReleased() -> Never {
    fatalError("Native state is already released")
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
}
