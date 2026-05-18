// Copyright 2025-present 650 Industries. All rights reserved.

/**
 Structured crash report extracted from MetricKit's `MXCrashDiagnostic`.
 */
public struct CrashReport: Codable, Sendable {
  /** Mach exception type (e.g. EXC_BAD_ACCESS, EXC_CRASH). */
  public let exceptionType: Int?

  /** Processor-specific exception code. */
  public let exceptionCode: Int?

  /** Unix signal number (e.g. SIGSEGV = 11, SIGABRT = 6). */
  public let signal: Int?

  /** Human-readable description of the termination reason. */
  public let terminationReason: String?

  /** Memory region info for bad-access crashes. */
  public let virtualMemoryRegionInfo: String?

  /** Objective-C exception details, available when the crash was caused by an unhandled NSException. */
  public let exceptionReason: ExceptionReason?

  /** Call stack tree, suitable for off-device symbolication. */
  public let callStackTree: CallStackTree?

  /** App version at the time of the crash. */
  public let appVersion: String

  /** Timestamp range start of the diagnostic payload. */
  public let timestampBegin: Date

  /** Timestamp range end of the diagnostic payload. */
  public let timestampEnd: Date

  /**
   Timestamp at which this device received the diagnostic and constructed the report.
   Distinct from `timestampEnd` because MetricKit can deliver historical or backlogged
   diagnostics — `ingestedAt` reflects when *we* learned about the crash, not when it
   happened.
   */
  public let ingestedAt: Date

  /**
   Picks the most likely main session that this crash report belongs to.

   MetricKit only gives us the diagnostic payload's time window (`timestampBegin` to
   `timestampEnd`, typically a 24-hour bucket), not an exact crash time. Xcode's
   "Simulate MetricKit Payloads" delivers a zero-width window where both timestamps
   equal "now," so we can't rely on the session's start time falling inside it.

   1. Treat each session as the interval `[startDate, endDate ?? .distantFuture]` and
      pick sessions that intersect the payload window. Among those, prefer the one
      that never finished (`endDate == nil`) — an unfinished main session is a strong
      signal of a crash. Otherwise pick the intersecting session with the latest start time.
   2. If nothing intersects *and* the window is zero-width (Xcode-simulated payloads
      where intersection is impossible by construction), fall back to the latest
      unfinished session overall, then to the latest session by start time.
   3. Otherwise return `nil` — a real payload window that doesn't overlap any session
      is genuinely unattributable, and silently misattributing it to the current
      session would hide that.
   */
  func findMatchingSession(in mainSessions: [SessionRow]) -> SessionRow? {
    let payloadBegin = timestampBegin.ISO8601Format()
    let payloadEnd = timestampEnd.ISO8601Format()
    let intersecting = mainSessions.filter { session in
      guard session.startTimestamp <= payloadEnd else {
        return false
      }
      // No end timestamp means the session is still active — it overlaps anything in its future.
      guard let sessionEnd = session.endTimestamp else {
        return true
      }
      return sessionEnd >= payloadBegin
    }
    let candidates: [SessionRow]
    if !intersecting.isEmpty {
      candidates = intersecting
    } else if timestampBegin == timestampEnd {
      candidates = mainSessions
    } else {
      return nil
    }
    let unfinished = candidates.filter({ $0.endTimestamp == nil })
    if let session = unfinished.max(by: { $0.startTimestamp < $1.startTimestamp }) {
      return session
    }
    return candidates.max(by: { $0.startTimestamp < $1.startTimestamp })
  }

  /**
   Mirrors the shape of `MXCallStackTree.JSONRepresentation()`. Every field is optional so that
   silently-renamed or removed Apple fields don't break decoding for the rest of the report.
   */
  public struct CallStackTree: Codable, Sendable {
    public let callStacks: [CallStack]?

    public struct CallStack: Codable, Sendable {
      public let threadAttributed: Bool?
      public let callStackRootFrames: [Frame]?
    }

    public struct Frame: Codable, Sendable {
      public let binaryName: String?
      public let binaryUUID: String?
      public let address: UInt64?
      public let offsetIntoBinaryTextSegment: UInt64?
      public let sampleCount: Int?
      public let subFrames: [Frame]?
      /**
       Resolved symbol from on-device `dladdr` symbolication. Swift and Itanium-ABI C++
       names are demangled; Objective-C selectors and plain C symbols are returned as-is.
       `nil` when the binary is not loaded in this process or `dladdr` could not resolve it.
       */
      public let symbol: String?
    }
  }

  /**
   Objective-C exception details from `MXCrashDiagnosticObjectiveCExceptionReason`.
   */
  public struct ExceptionReason: Codable, Sendable {
    /** Human-readable exception summary. */
    public let composedMessage: String

    /** Exception message template before argument substitution. */
    public let formatString: String

    /** Arguments substituted into the format string. */
    public let arguments: [String]

    /** Human-readable exception type (e.g. "NSInvalidArgumentException"). */
    public let exceptionType: String

    /** Exception class name (e.g. "NSException"). */
    public let className: String

    /** Exception name field. */
    public let exceptionName: String
  }
}

// MARK: - MetricKit

#if !os(tvOS)
import MetricKit

extension CrashReport {
  init(diagnostic: MXCrashDiagnostic, payload: MXDiagnosticPayload) {
    self.exceptionType = diagnostic.exceptionType?.intValue
    self.exceptionCode = diagnostic.exceptionCode?.intValue
    self.signal = diagnostic.signal?.intValue
    self.terminationReason = diagnostic.terminationReason as String?
    self.virtualMemoryRegionInfo = diagnostic.virtualMemoryRegionInfo as String?
    let decodedTree = try? JSONDecoder().decode(CallStackTree.self, from: diagnostic.callStackTree.jsonRepresentation())
    self.callStackTree = decodedTree.map(CrashReportSymbolicator.symbolicate)
    self.appVersion = diagnostic.applicationVersion
    self.timestampBegin = payload.timeStampBegin
    self.timestampEnd = payload.timeStampEnd
    self.ingestedAt = Date.now

    if #available(iOS 17.0, *), let reason = diagnostic.exceptionReason {
      self.exceptionReason = ExceptionReason(
        composedMessage: reason.composedMessage as String,
        formatString: reason.formatString as String,
        arguments: reason.arguments.map { $0 as String },
        exceptionType: reason.exceptionType as String,
        className: reason.className as String,
        exceptionName: reason.exceptionName as String
      )
    } else {
      self.exceptionReason = nil
    }
  }
}
#endif

// MARK: - CustomStringConvertible

extension CrashReport: CustomStringConvertible {
  public var description: String {
    var lines: [String] = ["[CrashReport] App version: \(appVersion)"]

    if let exceptionType {
      lines.append("  Exception: type=\(exceptionName(for: exceptionType)) code=\(exceptionCode.map(String.init) ?? "unknown")")
    }
    if let signal {
      lines.append("  Signal: \(signalName(for: signal)) (\(signal))")
    }
    if let terminationReason {
      lines.append("  Termination reason: \(terminationReason)")
    }
    if let virtualMemoryRegionInfo {
      lines.append("  VM region: \(virtualMemoryRegionInfo)")
    }
    if let exceptionReason {
      lines.append("  ObjC exception: \(exceptionReason.exceptionType) (\(exceptionReason.className))")
      lines.append("    \(exceptionReason.composedMessage)")
    }

    let formatter = ISO8601DateFormatter()
    lines.append("  Time window: \(formatter.string(from: timestampBegin)) – \(formatter.string(from: timestampEnd))")

    return lines.joined(separator: "\n")
  }
}

private func exceptionName(for type: Int) -> String {
  switch type {
  case 1: return "EXC_BAD_ACCESS"
  case 2: return "EXC_BAD_INSTRUCTION"
  case 3: return "EXC_ARITHMETIC"
  case 4: return "EXC_EMULATION"
  case 5: return "EXC_SOFTWARE"
  case 6: return "EXC_BREAKPOINT"
  case 10: return "EXC_CRASH"
  case 11: return "EXC_RESOURCE"
  case 12: return "EXC_GUARD"
  default: return "EXC_\(type)"
  }
}

private func signalName(for signal: Int) -> String {
  switch signal {
  case 4: return "SIGILL"
  case 5: return "SIGTRAP"
  case 6: return "SIGABRT"
  case 8: return "SIGFPE"
  case 9: return "SIGKILL"
  case 10: return "SIGBUS"
  case 11: return "SIGSEGV"
  default: return "SIG\(signal)"
  }
}
