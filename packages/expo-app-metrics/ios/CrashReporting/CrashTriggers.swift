// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

/**
 Helpers that intentionally crash the app to produce real MetricKit crash diagnostics.
 Use only for testing the crash-reporting pipeline.
 */
enum CrashTriggers {
  /** EXC_BAD_ACCESS / SIGSEGV — dereference a bogus pointer. */
  static func badAccess() -> Never {
    let pointer = UnsafePointer<Int>(bitPattern: 0x1)!
    _ = pointer.pointee
    fatalError("unreachable")
  }

  /** EXC_CRASH / SIGABRT — Swift fatalError. */
  static func fatalErrorCrash() -> Never {
    fatalError("Intentional fatalError for crash-reporting test")
  }

  /** EXC_ARITHMETIC / SIGFPE — integer divide by zero. */
  static func divideByZero() -> Never {
    let zero = Int("0")!
    _ = 1 / zero
    fatalError("unreachable")
  }

  /** EXC_BAD_INSTRUCTION — force-unwrap nil. */
  static func forceUnwrapNil() -> Never {
    let value: Int? = nil
    _ = value!
    fatalError("unreachable")
  }

  /** Out-of-bounds array access — also EXC_BAD_INSTRUCTION via Swift's runtime trap. */
  static func arrayOutOfBounds() -> Never {
    let array: [Int] = []
    _ = array[5]
    fatalError("unreachable")
  }

  /** Uncaught Objective-C exception — produces `exceptionReason` in MetricKit. */
  static func objcException() -> Never {
    NSException(
      name: .invalidArgumentException,
      reason: "Intentional NSException for crash-reporting test",
      userInfo: nil
    ).raise()
    fatalError("unreachable")
  }

  /** Stack overflow via unbounded recursion. */
  static func stackOverflow() -> Never {
    Self.stackOverflow()
  }
}
