// Copyright 2025-present 650 Industries. All rights reserved.

/**
 Creates a randomized crash report for testing the storage and logging path.
 Each call picks a random crash type (e.g. EXC_BAD_ACCESS/SIGSEGV, EXC_CRASH/SIGABRT)
 with randomized exception codes, timestamps, call stack tree, and occasionally an ObjC exception reason.
 */
func simulateCrashReport() {
  let crashes: [(exceptionType: Int, signal: Int, terminationReason: String)] = [
    (1, 11, "Namespace SIGNAL, Code 0xb"),
    (1, 10, "Namespace SIGNAL, Code 0xa"),
    (10, 6, "Namespace SIGNAL, Code 0x6"),
    (10, 5, "Namespace SIGNAL, Code 0x5"),
    (2, 4, "Namespace SIGNAL, Code 0x4"),
    (5, 6, "Namespace SIGNAL, Code 0x6"),
  ]
  let crash = crashes.randomElement()!
  let hoursAgo = Double.random(in: 1...24) * 3600
  let report = CrashReport(
    exceptionType: crash.exceptionType,
    exceptionCode: Int.random(in: 0...255),
    signal: crash.signal,
    terminationReason: crash.terminationReason,
    virtualMemoryRegionInfo: crash.exceptionType == 1 ? "0x\(String(UInt.random(in: 0...0xFFFF), radix: 16)) is not in any region" : nil,
    exceptionReason: simulateExceptionReason(),
    callStackTree: simulateCallStackTree(),
    appVersion: AppInfo.current.appVersion ?? "unknown",
    timestampBegin: Date.now.addingTimeInterval(-hoursAgo - 3600),
    timestampEnd: Date.now.addingTimeInterval(-hoursAgo),
    ingestedAt: Date.now
  )
  AppMetricsActor.isolated {
    AppMetrics.mainSession.storeCrashReport(report)
  }
}

/**
 Generates a fake call stack tree matching MetricKit's shape.
 */
private func simulateCallStackTree() -> CrashReport.CallStackTree {
  typealias Frame = CrashReport.CallStackTree.Frame

  func makeFrame(binary: String, addressRange: ClosedRange<UInt64>, offsetRange: ClosedRange<UInt64>) -> Frame {
    return Frame(
      binaryName: binary,
      binaryUUID: UUID().uuidString,
      address: UInt64.random(in: addressRange),
      offsetIntoBinaryTextSegment: UInt64.random(in: offsetRange),
      sampleCount: 1,
      subFrames: nil,
      symbol: nil
    )
  }

  let baseAddress = UInt64.random(in: 0x100000000...0x100100000)
  let frames: [Frame] = [
    makeFrame(binary: "ExpoAppMetrics", addressRange: baseAddress + 0x1000...baseAddress + 0x9000, offsetRange: 0x1000...0x9000),
    makeFrame(binary: "UIKitCore", addressRange: 0x180000000...0x190000000, offsetRange: 0x10000...0x90000),
    makeFrame(binary: "libdispatch.dylib", addressRange: 0x190000000...0x1A0000000, offsetRange: 0x1000...0x5000),
    makeFrame(binary: "libsystem_pthread.dylib", addressRange: 0x1A0000000...0x1B0000000, offsetRange: 0x1000...0x3000),
  ]

  return CrashReport.CallStackTree(
    callStacks: [
      CrashReport.CallStackTree.CallStack(threadAttributed: true, callStackRootFrames: frames)
    ]
  )
}

/**
 Randomly returns an ObjC exception reason (about half the time) or nil.
 */
private func simulateExceptionReason() -> CrashReport.ExceptionReason? {
  guard Bool.random() else {
    return nil
  }
  let exceptions: [(type: String, name: String, message: String, format: String, arguments: [String])] = [
    (
      "NSInvalidArgumentException",
      "NSInvalidArgumentException",
      "-[NSNull objectForKey:]: unrecognized selector sent to instance 0x1f8a7e8b0",
      "-[%@ %@]: unrecognized selector sent to instance %@",
      ["NSNull", "objectForKey:", "0x1f8a7e8b0"]
    ),
    (
      "NSRangeException",
      "NSRangeException",
      "*** -[__NSArrayM objectAtIndexedSubscript:]: index 5 beyond bounds [0 .. 2]",
      "*** -[%@ objectAtIndexedSubscript:]: index %@ beyond bounds [0 .. %@]",
      ["__NSArrayM", "5", "2"]
    ),
    (
      "NSInternalInconsistencyException",
      "NSInternalInconsistencyException",
      "Invalid update: invalid number of rows in section 0",
      "Invalid update: invalid number of rows in section %@",
      ["0"]
    ),
    (
      "NSGenericException",
      "NSGenericException",
      "*** Collection <__NSArrayM: 0x283a14f00> was mutated while being enumerated",
      "*** Collection <%@: %@> was mutated while being enumerated",
      ["__NSArrayM", "0x283a14f00"]
    ),
  ]
  let exception = exceptions.randomElement()!
  return CrashReport.ExceptionReason(
    composedMessage: exception.message,
    formatString: exception.format,
    arguments: exception.arguments,
    exceptionType: exception.type,
    className: "NSException",
    exceptionName: exception.name
  )
}
