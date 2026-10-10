// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

/// A main-thread hang reported by the OS, from MetricKit's `MXHangDiagnostic` (any hang above the
/// system threshold, ~250 ms) or `MXAppLaunchDiagnostic` (a launch that took long enough for the
/// OS to flag it). Both carry the main thread's call stack, so a hang the app never noticed itself
/// still arrives with a backtrace — delivered on a later launch, device only.
public struct HangReport: Codable, Sendable {
  public enum Kind: String, Codable, Sendable {
    case hang
    case slowLaunch
  }

  private static let maxLogStackFrames = 50
  private static let maxLogStacktraceLength = 65_536

  public let kind: Kind

  /// Seconds the main thread hung (or, for `slowLaunch`, the launch took).
  public let duration: TimeInterval

  /// Call stack tree, symbolicated on device, suitable for off-device re-symbolication.
  public let callStackTree: CrashReport.CallStackTree?

  /// App version at the time of the hang.
  public let appVersion: String

  /// Timestamp range of the diagnostic payload.
  public let timestampBegin: Date
  public let timestampEnd: Date

  /// When this device received the diagnostic.
  public let ingestedAt: Date

  func findMatchingSession(in mainSessions: [SessionRow]) -> SessionRow? {
    return MetricKitSessionMatcher.findMatchingSession(windowBegin: timestampBegin, windowEnd: timestampEnd, in: mainSessions)
  }

  /// Stable key so a diagnostic redelivered through `pastDiagnosticPayloads` is stored once.
  var fingerprint: String {
    let end = Int(timestampEnd.timeIntervalSince1970)
    let frames = callStackTree?.render(maxFrames: 4, maxLength: 1024)?.stacktrace ?? ""
    return "\(kind.rawValue):\(end):\(Int(duration * 1000)):\(frames.hashValue)"
  }

  /// Builds the `native.hang` / `native.slow_launch` log event.
  func toLogRecord() -> LogRecord {
    let rendered = callStackTree?.render(maxFrames: Self.maxLogStackFrames, maxLength: Self.maxLogStacktraceLength)
    var attributes: [String: Any] = [
      "expo.hang.kind": kind.rawValue,
      "expo.hang.source": "metrickit",
      "expo.hang.duration_ms": (duration * 1000).rounded(),
      "expo.hang.app_version": appVersion,
      "expo.hang.window_begin": timestampBegin.ISO8601Format(),
      "expo.hang.window_end": timestampEnd.ISO8601Format()
    ]
    if let rendered, rendered.renderedFrameCount > 0 {
      attributes["expo.hang.stacktrace"] = rendered.stacktrace as Any
      attributes["expo.hang.rendered_frame_count"] = rendered.renderedFrameCount
      attributes["expo.hang.total_frame_count"] = rendered.totalFrameCount
      if let binaryUUIDs = rendered.binaryUUIDs {
        attributes["expo.hang.binary_uuids"] = binaryUUIDs
      }
    }
    return LogRecord(
      name: kind == .hang ? "native.hang" : "native.slow_launch",
      attributes: attributes,
      severity: .warn,
      timestamp: timestampEnd.ISO8601Format()
    )
  }
}

#if !os(tvOS)
import MetricKit

extension HangReport {
  init(diagnostic: MXHangDiagnostic, payload: MXDiagnosticPayload) {
    self.init(
      kind: .hang,
      duration: diagnostic.hangDuration.converted(to: .seconds).value,
      callStackTree: Self.decodeTree(diagnostic.callStackTree),
      appVersion: diagnostic.applicationVersion,
      payload: payload
    )
  }

  @available(iOS 16.0, *)
  init(diagnostic: MXAppLaunchDiagnostic, payload: MXDiagnosticPayload) {
    self.init(
      kind: .slowLaunch,
      duration: diagnostic.launchDuration.converted(to: .seconds).value,
      callStackTree: Self.decodeTree(diagnostic.callStackTree),
      appVersion: diagnostic.applicationVersion,
      payload: payload
    )
  }

  private init(
    kind: Kind,
    duration: TimeInterval,
    callStackTree: CrashReport.CallStackTree?,
    appVersion: String,
    payload: MXDiagnosticPayload
  ) {
    self.kind = kind
    self.duration = duration
    self.callStackTree = callStackTree
    self.appVersion = appVersion
    self.timestampBegin = payload.timeStampBegin
    self.timestampEnd = payload.timeStampEnd
    self.ingestedAt = Date.now
  }

  private static func decodeTree(_ tree: MXCallStackTree) -> CrashReport.CallStackTree? {
    let decoded = try? JSONDecoder().decode(CrashReport.CallStackTree.self, from: tree.jsonRepresentation())
    return decoded.map(CrashReportSymbolicator.symbolicate)
  }
}
#endif
