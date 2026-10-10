import Foundation
import Testing

@testable import ExpoAppMetrics

@Suite("MetricKitHistogram")
struct MetricKitHistogramTests {
  @Test
  func `median is interpolated inside the bucket where the cumulative count crosses half`() {
    let buckets = [
      MetricKitHistogramBucket(start: 0, end: 1, count: 2),
      MetricKitHistogramBucket(start: 1, end: 2, count: 4),
      MetricKitHistogramBucket(start: 2, end: 3, count: 2),
    ]
    // 8 samples, half = 4: 2 in the first bucket, so halfway through the second.
    #expect(MetricKitHistogram.estimatedMedian(buckets) == 1.5)
    #expect(MetricKitHistogram.sampleCount(buckets) == 8)
  }

  @Test
  func `median of an empty histogram is nil`() {
    #expect(MetricKitHistogram.estimatedMedian([]) == nil)
    #expect(MetricKitHistogram.estimatedMedian([MetricKitHistogramBucket(start: 0, end: 1, count: 0)]) == nil)
  }
}

@Suite("MetricKitLaunchReport")
struct MetricKitLaunchReportTests {
  private let report = MetricKitLaunchReport(
    timeToFirstDraw: [MetricKitHistogramBucket(start: 0.4, end: 0.5, count: 3)],
    optimizedTimeToFirstDraw: nil,
    applicationResumeTime: [],
    extendedLaunch: nil,
    applicationHangTime: [MetricKitHistogramBucket(start: 0.25, end: 0.5, count: 1)],
    appVersion: "1.2.0",
    includesMultipleAppVersions: false,
    timestampBegin: Date(timeIntervalSince1970: 0),
    timestampEnd: Date(timeIntervalSince1970: 86_400),
    ingestedAt: .now
  )

  @Test
  func `metrics are emitted per non-empty histogram with the estimated median`() {
    let metrics = report.toMetrics()
    #expect(metrics.map(\.name).sorted() == ["osApplicationHangTime", "osTimeToFirstDraw"])
    let ttfd = metrics.first { $0.name == "osTimeToFirstDraw" }
    #expect(ttfd?.category == .appStartup)
    #expect(ttfd.map { abs($0.value - 0.45) < 0.0001 } == true)
    #expect((ttfd?.params?.value as? [String: Any])?["expo.metrickit.sample_count"] as? Int == 3)
  }

  @Test
  func `log record carries the histograms`() throws {
    let attributes = try #require(report.toLogRecord().attributes?.value as? [String: Any])
    #expect(report.toLogRecord().name == "metrickit.app_launch")
    let histogram = try #require(attributes["expo.metrickit.timeToFirstDraw.histogram"] as? [[String: Any]])
    #expect(histogram.count == 1)
    #expect(histogram[0]["count"] as? Int == 3)
    #expect(attributes["expo.metrickit.applicationResumeTime.histogram"] == nil)
  }

  @Test
  func `report with only empty histograms is empty`() {
    let empty = MetricKitLaunchReport(
      timeToFirstDraw: [],
      optimizedTimeToFirstDraw: nil,
      applicationResumeTime: nil,
      extendedLaunch: nil,
      applicationHangTime: nil,
      appVersion: "1",
      includesMultipleAppVersions: false,
      timestampBegin: .now,
      timestampEnd: .now,
      ingestedAt: .now
    )
    #expect(empty.isEmpty)
    #expect(!report.isEmpty)
  }
}

@Suite("HangReport")
struct HangReportTests {
  @Test
  func `hang log record has the duration and the stack`() throws {
    let tree = CrashReport.CallStackTree(callStacks: [
      .init(
        threadAttributed: true,
        callStackRootFrames: [
          .init(
            binaryName: "App",
            binaryUUID: "B",
            address: 1,
            offsetIntoBinaryTextSegment: 32,
            sampleCount: 1,
            subFrames: nil,
            symbol: "MIDIClientCreateWithBlock"
          )
        ]
      )
    ])
    let report = HangReport(
      kind: .hang,
      duration: 0.645,
      callStackTree: tree,
      appVersion: "1.2.0",
      timestampBegin: Date(timeIntervalSince1970: 0),
      timestampEnd: Date(timeIntervalSince1970: 60),
      ingestedAt: .now
    )
    let record = report.toLogRecord()
    let attributes = try #require(record.attributes?.value as? [String: Any])
    #expect(record.name == "native.hang")
    #expect(record.severity == .warn)
    #expect(attributes["expo.hang.duration_ms"] as? Double == 645)
    #expect(attributes["expo.hang.stacktrace"] as? String == "MIDIClientCreateWithBlock (App + 32)")
    #expect(attributes["expo.hang.binary_uuids"] as? [String] == ["App:B"])
  }

  @Test
  func `slow launch uses its own event name and fingerprint differs by kind`() {
    let hang = HangReport(
      kind: .hang,
      duration: 3,
      callStackTree: nil,
      appVersion: "1",
      timestampBegin: Date(timeIntervalSince1970: 0),
      timestampEnd: Date(timeIntervalSince1970: 60),
      ingestedAt: .now
    )
    let slowLaunch = HangReport(
      kind: .slowLaunch,
      duration: 3,
      callStackTree: nil,
      appVersion: "1",
      timestampBegin: Date(timeIntervalSince1970: 0),
      timestampEnd: Date(timeIntervalSince1970: 60),
      ingestedAt: .now
    )
    #expect(slowLaunch.toLogRecord().name == "native.slow_launch")
    #expect(hang.fingerprint != slowLaunch.fingerprint)
    #expect(hang.fingerprint == hang.fingerprint)
  }
}
