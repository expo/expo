// Copyright 2026-present 650 Industries. All rights reserved.

/// An app hang from MetricKit's `MXHangDiagnostic`. The app recovered, so a hang is a log on its
/// session, not the session's crash report.
struct HangReport: Sendable {
  let hangDuration: TimeInterval
  let callStackTree: CrashReport.CallStackTree?
  /// ID of the hung process. `nil` before iOS 17 and when MetricKit does not know it.
  let processId: Int?
  let timestampBegin: Date
  let timestampEnd: Date

  /// The session of the hung process. Without a process ID, a hang matches only when exactly one
  /// session overlaps the payload window, because nothing tells several sessions apart.
  func findMatchingSession(in mainSessions: [SessionRow]) -> SessionRow? {
    let intersecting = sessions(mainSessions, intersectingFrom: timestampBegin, to: timestampEnd)
    if let processId {
      let sameProcess = intersecting.filter { $0.processId == processId }
      return sameProcess.max(by: { $0.startTimestamp < $1.startTimestamp })
    }
    return intersecting.count == 1 ? intersecting.first : nil
  }

  func toLogRecord() -> LogRecord {
    let callStacks = callStackTree?.callStacks ?? []
    // Without an attributed thread, take the first one instead of mixing frames from several threads.
    let hungThread = callStacks.first { $0.threadAttributed == true } ?? callStacks.first
    let selected = hungThread.map { CrashReport.collectFrames(in: [$0]) }
    var attributes: [String: Any] = [
      "exception.type": "AppHang",
      // A fixed message, so that the dashboard groups hangs by their stack, not by their duration.
      "exception.message": "The app did not respond",
      "exception.stacktrace": selected.flatMap(CrashReport.renderStacktrace) as Any,
      "expo.error.source": "appHang",
      "expo.error.is_fatal": false,
      "expo.hang.duration_ms": Int((hangDuration * 1000).rounded()),
    ]
    if let selected, let binaryUUIDs = CrashReport.renderedBinaryUUIDs(in: selected.frames) {
      attributes["expo.crash.binary_uuids"] = binaryUUIDs
    }
    return LogRecord(
      name: nativeExceptionLogName,
      attributes: attributes,
      severity: .error,
      timestamp: timestampEnd.ISO8601Format()
    )
  }
}

#if !os(tvOS)
import MetricKit

extension HangReport {
  init(diagnostic: MXHangDiagnostic, payload: MXDiagnosticPayload) {
    self.hangDuration = diagnostic.hangDuration.converted(to: .seconds).value
    let decodedTree = try? JSONDecoder().decode(
      CrashReport.CallStackTree.self,
      from: diagnostic.callStackTree.jsonRepresentation()
    )
    self.callStackTree = decodedTree.map(CrashReportSymbolicator.symbolicate)
    if #available(iOS 17.0, *) {
      // MetricKit uses -1 when it does not know the process ID.
      let pid = diagnostic.metaData.pid
      self.processId = pid > 0 ? Int(pid) : nil
    } else {
      self.processId = nil
    }
    self.timestampBegin = payload.timeStampBegin
    self.timestampEnd = payload.timeStampEnd
  }
}
#endif
