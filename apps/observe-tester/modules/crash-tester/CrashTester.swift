// Copyright 2025-present 650 Industries. All rights reserved.

internal import ExpoModulesCore
import Foundation

/// Crash kinds accepted by `triggerCrash`. Raw values match the TypeScript `CrashKind` union.
enum CrashKind: String, Enumerable {
  /// EXC_BAD_ACCESS / SIGSEGV — dereference of a bogus pointer.
  case badAccess
  /// EXC_CRASH / SIGABRT — Swift `fatalError`.
  case fatalError
  /// EXC_ARITHMETIC / SIGFPE — integer divide by zero.
  case divideByZero
  /// EXC_BAD_INSTRUCTION — force-unwrap of a nil optional.
  case forceUnwrapNil
  /// EXC_BAD_INSTRUCTION — out-of-bounds Swift array access.
  case arrayOutOfBounds
  /// Uncaught Objective-C `NSException`, populates MetricKit's `exceptionReason`.
  case objcException
  /// Stack overflow via unbounded recursion.
  case stackOverflow
}

/// Inline module that exposes crash triggers to the observe-tester app. Test-only:
/// it intentionally crashes the process to exercise the crash-reporting pipeline.
class CrashTester: Module {
  public func definition() -> ModuleDefinition {
    Function("triggerCrash") { (kind: CrashKind) in
      switch kind {
      case .badAccess: CrashTriggers.badAccess()
      case .fatalError: CrashTriggers.fatalErrorCrash()
      case .divideByZero: CrashTriggers.divideByZero()
      case .forceUnwrapNil: CrashTriggers.forceUnwrapNil()
      case .arrayOutOfBounds: CrashTriggers.arrayOutOfBounds()
      case .objcException: CrashTriggers.objcException()
      case .stackOverflow: CrashTriggers.stackOverflow()
      }
    }
  }
}

/// Helpers that intentionally crash the app to produce real MetricKit crash diagnostics.
/// Use only for testing the crash-reporting pipeline.
enum CrashTriggers {
  /// EXC_BAD_ACCESS / SIGSEGV — dereference a bogus pointer.
  static func badAccess() -> Never {
    let pointer = UnsafePointer<Int>(bitPattern: 0x1)!
    _ = pointer.pointee
    fatalError("unreachable")
  }

  /// EXC_CRASH / SIGABRT — Swift fatalError.
  static func fatalErrorCrash() -> Never {
    fatalError("Intentional fatalError for crash-reporting test")
  }

  /// EXC_ARITHMETIC / SIGFPE — integer divide by zero.
  static func divideByZero() -> Never {
    let zero = Int("0")!
    _ = 1 / zero
    fatalError("unreachable")
  }

  /// EXC_BAD_INSTRUCTION — force-unwrap nil.
  static func forceUnwrapNil() -> Never {
    let value: Int? = nil
    _ = value!
    fatalError("unreachable")
  }

  /// Out-of-bounds array access — also EXC_BAD_INSTRUCTION via Swift's runtime trap.
  static func arrayOutOfBounds() -> Never {
    let array: [Int] = []
    _ = array[5]
    fatalError("unreachable")
  }

  /// Uncaught Objective-C exception — produces `exceptionReason` in MetricKit.
  static func objcException() -> Never {
    NSException(
      name: .invalidArgumentException,
      reason: "Intentional NSException for crash-reporting test",
      userInfo: nil
    ).raise()
    fatalError("unreachable")
  }

  /// Stack overflow via unbounded recursion.
  static func stackOverflow() -> Never {
    Self.stackOverflow()
  }
}
