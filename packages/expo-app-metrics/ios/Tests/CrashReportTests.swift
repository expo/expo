import Testing

@testable import ExpoAppMetrics

@AppMetricsActor
@Suite("CrashReport")
struct CrashReportTests {
  @Suite("toLogRecord")
  struct ToLogRecordTests {
    @Test
    func `builds a fatal exception log for a Mach exception`() throws {
      let timestampEnd = Date(timeIntervalSince1970: 1_699_999_000)
      let ingestedAt = Date(timeIntervalSince1970: 1_700_000_000)
      let report = makeCrashReport(
        timestampBegin: timestampEnd.addingTimeInterval(-3600),
        timestampEnd: timestampEnd,
        ingestedAt: ingestedAt,
        exceptionType: 1,
        exceptionCode: 2,
        signal: 11,
        terminationReason: "Namespace SIGNAL, Code 11"
      )

      let log = report.toLogRecord()
      let attributes = try #require(log.attributes?.value as? [String: Any])

      #expect(log.name == "native.exception")
      #expect(log.severity == .fatal)
      #expect(log.timestamp == timestampEnd.ISO8601Format())
      #expect(attributes["exception.type"] as? String == "EXC_BAD_ACCESS")
      #expect(attributes["exception.message"] as? String == "Namespace SIGNAL, Code 11")
      #expect(attributes["expo.error.source"] as? String == "nativeCrash")
      #expect(attributes["expo.error.is_fatal"] as? Bool == true)
      #expect(attributes["expo.crash.exception_type"] as? String == "EXC_BAD_ACCESS")
      #expect(attributes["expo.crash.exception_type_code"] as? Int == 1)
      #expect(attributes["expo.crash.exception_code"] as? Int == 2)
      #expect(attributes["expo.crash.signal"] as? String == "SIGSEGV")
      #expect(attributes["expo.crash.signal_number"] as? Int == 11)
      #expect(attributes["expo.crash.termination_reason"] as? String == "Namespace SIGNAL, Code 11")
    }

    @Test
    func `uses Objective-C exception details`() throws {
      let report = makeCrashReport(
        timestampBegin: Date.now,
        timestampEnd: Date.now,
        terminationReason: "Application Specific Information",
        exceptionReason: CrashReport.ExceptionReason(
          composedMessage: "-[NSNull length]: unrecognized selector",
          formatString: "%@: unrecognized selector",
          arguments: ["-[NSNull length]"],
          exceptionType: "NSInvalidArgumentException",
          className: "NSException",
          exceptionName: "NSInvalidArgumentException"
        )
      )

      let attributes = try #require(report.toLogRecord().attributes?.value as? [String: Any])
      #expect(attributes["exception.type"] as? String == "NSInvalidArgumentException")
      #expect(
        attributes["exception.message"] as? String
          == "Application Specific Information\n-[NSNull length]: unrecognized selector"
      )
      #expect(attributes["expo.crash.objc_exception_type"] as? String == "NSInvalidArgumentException")
      #expect(
        attributes["expo.crash.objc_exception_message"] as? String == "-[NSNull length]: unrecognized selector"
      )
    }

    @Test
    func `describes how the trace was built`() throws {
      let attributedFrames = (0..<53).map { index in
        CrashReport.CallStackTree.Frame(
          binaryName: "TestApp",
          binaryUUID: "9F0C0F7E-1E55-4B0E-9C6E-1D6E6F0C0F7E",
          address: nil,
          offsetIntoBinaryTextSegment: UInt64(index),
          sampleCount: nil,
          subFrames: nil,
          symbol: "frame\(index)"
        )
      }
      let report = makeCrashReport(
        timestampBegin: Date.now,
        timestampEnd: Date.now,
        callStackTree: CrashReport.CallStackTree(callStacks: [
          CrashReport.CallStackTree.CallStack(
            threadAttributed: true,
            callStackRootFrames: attributedFrames
          ),
          CrashReport.CallStackTree.CallStack(
            threadAttributed: false,
            callStackRootFrames: [
              CrashReport.CallStackTree.Frame(
                binaryName: "Other",
                binaryUUID: "11111111-1111-1111-1111-111111111111",
                address: nil,
                offsetIntoBinaryTextSegment: 0,
                sampleCount: nil,
                subFrames: nil,
                symbol: "unattributed"
              )
            ]
          ),
        ])
      )
      let attributes = try #require(report.toLogRecord().attributes?.value as? [String: Any])
      #expect(attributes["expo.crash.thread_count"] as? Int == 2)
      #expect(attributes["expo.crash.thread_attributed"] as? Bool == true)
      #expect(attributes["expo.crash.rendered_frame_count"] as? Int == 50)
      #expect(attributes["expo.crash.total_frame_count"] as? Int == 53)
      // Only the binaries actually rendered, so the unattributed thread's is absent.
      #expect(
        attributes["expo.crash.binary_uuids"] as? [String]
          == ["TestApp:9F0C0F7E-1E55-4B0E-9C6E-1D6E6F0C0F7E"]
      )
    }

    @Test
    func `reports no thread as attributed when MetricKit flags none`() throws {
      let report = makeCrashReport(
        timestampBegin: Date.now,
        timestampEnd: Date.now,
        callStackTree: CrashReport.CallStackTree(callStacks: [
          CrashReport.CallStackTree.CallStack(
            threadAttributed: false,
            callStackRootFrames: [
              CrashReport.CallStackTree.Frame(
                binaryName: "TestApp",
                binaryUUID: nil,
                address: nil,
                offsetIntoBinaryTextSegment: 128,
                sampleCount: nil,
                subFrames: nil,
                symbol: nil
              )
            ]
          )
        ])
      )
      let attributes = try #require(report.toLogRecord().attributes?.value as? [String: Any])
      #expect(attributes["expo.crash.thread_attributed"] as? Bool == false)
      #expect(attributes["expo.crash.thread_count"] as? Int == 1)
      // No UUID on the frame, so the attribute is left off rather than emitted empty.
      #expect(attributes["expo.crash.binary_uuids"] == nil)
      // Nothing to name it with, so the trace keeps the address on its own.
      let stacktrace = try #require(attributes["exception.stacktrace"] as? String)
      #expect(stacktrace == "TestApp + 128")
    }

    @Test
    func `reports the faulting memory region`() throws {
      // A stack overflow looks like any other bad access until you check the region.
      let report = makeCrashReport(
        timestampBegin: Date.now,
        timestampEnd: Date.now,
        virtualMemoryRegionInfo: "0x16f603ff8 is in STACK GUARD region"
      )
      let attributes = try #require(report.toLogRecord().attributes?.value as? [String: Any])
      #expect(
        attributes["expo.crash.virtual_memory_region"] as? String
          == "0x16f603ff8 is in STACK GUARD region"
      )
    }

    @Test
    func `renders at most fifty attributed stack frames and reports the omitted count`() throws {
      let attributedFrames = (0..<53).map { index in
        CrashReport.CallStackTree.Frame(
          binaryName: "TestApp",
          binaryUUID: nil,
          address: nil,
          offsetIntoBinaryTextSegment: nil,
          sampleCount: nil,
          subFrames: nil,
          symbol: "frame\(index)"
        )
      }
      let unattributedFrame = CrashReport.CallStackTree.Frame(
        binaryName: "TestApp",
        binaryUUID: nil,
        address: nil,
        offsetIntoBinaryTextSegment: nil,
        sampleCount: nil,
        subFrames: nil,
        symbol: "unattributed"
      )
      let report = makeCrashReport(
        timestampBegin: Date.now,
        timestampEnd: Date.now,
        callStackTree: CrashReport.CallStackTree(callStacks: [
          CrashReport.CallStackTree.CallStack(
            threadAttributed: true,
            callStackRootFrames: attributedFrames
          ),
          CrashReport.CallStackTree.CallStack(
            threadAttributed: false,
            callStackRootFrames: [unattributedFrame]
          ),
        ])
      )

      let attributes = try #require(report.toLogRecord().attributes?.value as? [String: Any])
      let stacktrace = try #require(attributes["exception.stacktrace"] as? String)
      let lines = stacktrace.split(separator: "\n")
      #expect(lines.count == 51)
      // These fixtures carry no offset or address, so there's nothing to append to the symbol.
      #expect(lines.first == "frame0")
      #expect(lines[49] == "frame49")
      #expect(lines.last == "… +3 more frames")
      #expect(!stacktrace.contains("unattributed"))
    }
  }

}

func makeCrashReport(
  timestampBegin: Date,
  timestampEnd: Date,
  ingestedAt: Date = Date.now,
  exceptionType: Int? = 1,
  exceptionCode: Int? = 1,
  signal: Int? = 11,
  terminationReason: String? = nil,
  virtualMemoryRegionInfo: String? = nil,
  exceptionReason: CrashReport.ExceptionReason? = nil,
  callStackTree: CrashReport.CallStackTree? = nil
) -> CrashReport {
  return CrashReport(
    exceptionType: exceptionType,
    exceptionCode: exceptionCode,
    signal: signal,
    terminationReason: terminationReason,
    virtualMemoryRegionInfo: virtualMemoryRegionInfo,
    exceptionReason: exceptionReason,
    callStackTree: callStackTree,
    appVersion: "1.0.0",
    timestampBegin: timestampBegin,
    timestampEnd: timestampEnd,
    ingestedAt: ingestedAt
  )
}
