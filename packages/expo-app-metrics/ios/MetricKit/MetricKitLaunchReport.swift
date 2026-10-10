// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

/// One bucket of a MetricKit duration histogram, in seconds.
struct MetricKitHistogramBucket: Codable, Sendable, Equatable {
  let start: TimeInterval
  let end: TimeInterval
  let count: Int

  var asParams: [String: Any] {
    return ["start": start, "end": end, "count": count]
  }
}

enum MetricKitHistogram {
  static func sampleCount(_ buckets: [MetricKitHistogramBucket]) -> Int {
    return buckets.reduce(0) { $0 + $1.count }
  }

  /// Median estimated from bucket counts: the bucket where the cumulative count crosses half the
  /// samples, interpolated linearly inside it. MetricKit only hands out the histogram, so this is
  /// as close to "typical launch" as the OS data gets. `nil` for an empty histogram.
  static func estimatedMedian(_ buckets: [MetricKitHistogramBucket]) -> TimeInterval? {
    let sorted = buckets.filter { $0.count > 0 }.sorted { $0.start < $1.start }
    let total = sampleCount(sorted)
    guard total > 0 else {
      return nil
    }
    let target = Double(total) / 2
    var cumulative = 0.0
    for bucket in sorted {
      let next = cumulative + Double(bucket.count)
      if next >= target {
        let fraction = bucket.count > 0 ? (target - cumulative) / Double(bucket.count) : 0
        return bucket.start + (bucket.end - bucket.start) * fraction
      }
      cumulative = next
    }
    return sorted.last?.end
  }
}

/// The OS's own view of this app's launches, from `MXAppLaunchMetric` and
/// `MXAppResponsivenessMetric` in a daily `MXMetricPayload`.
///
/// `timeToFirstDraw` is what the user waited for — measured by the system from process launch to
/// the first frame, with no instrumentation in the app, across every launch in the window. It
/// covers what our own markers can't: pre-main, launches that never reached JS, and the real
/// first frame rather than the first React commit.
struct MetricKitLaunchReport: Codable, Sendable {
  let timeToFirstDraw: [MetricKitHistogramBucket]?
  let optimizedTimeToFirstDraw: [MetricKitHistogramBucket]?
  let applicationResumeTime: [MetricKitHistogramBucket]?
  let extendedLaunch: [MetricKitHistogramBucket]?
  let applicationHangTime: [MetricKitHistogramBucket]?
  let appVersion: String
  let includesMultipleAppVersions: Bool
  let timestampBegin: Date
  let timestampEnd: Date
  let ingestedAt: Date

  var isEmpty: Bool {
    return [timeToFirstDraw, optimizedTimeToFirstDraw, applicationResumeTime, extendedLaunch, applicationHangTime]
      .allSatisfy { $0 == nil || $0?.isEmpty == true }
  }

  /// Stable key so a payload redelivered through `pastPayloads` is stored once.
  var fingerprint: String {
    return "launch:\(Int(timestampBegin.timeIntervalSince1970)):\(Int(timestampEnd.timeIntervalSince1970))"
  }

  func findMatchingSession(in mainSessions: [SessionRow]) -> SessionRow? {
    return MetricKitSessionMatcher.findMatchingSession(windowBegin: timestampBegin, windowEnd: timestampEnd, in: mainSessions)
  }

  /// The full histograms as one `metrickit.app_launch` log event, for the detail view.
  func toLogRecord() -> LogRecord {
    var attributes: [String: Any] = [
      "expo.metrickit.app_version": appVersion,
      "expo.metrickit.includes_multiple_app_versions": includesMultipleAppVersions,
      "expo.metrickit.window_begin": timestampBegin.ISO8601Format(),
      "expo.metrickit.window_end": timestampEnd.ISO8601Format(),
    ]
    for (name, buckets) in histograms {
      attributes["expo.metrickit.\(name).histogram"] = buckets.map(\.asParams)
      attributes["expo.metrickit.\(name).sample_count"] = MetricKitHistogram.sampleCount(buckets)
    }
    return LogRecord(
      name: "metrickit.app_launch",
      attributes: attributes,
      severity: .info,
      timestamp: timestampEnd.ISO8601Format()
    )
  }

  /// One `appStartup` metric per histogram so the OS numbers chart next to our own: the value is
  /// the estimated median in seconds, the histogram rides along in `params`.
  func toMetrics() -> [Metric] {
    return histograms.compactMap { name, buckets in
      guard let median = MetricKitHistogram.estimatedMedian(buckets) else {
        return nil
      }
      return Metric(
        category: .appStartup,
        name: "os\(name.prefix(1).uppercased())\(name.dropFirst())",
        value: median,
        timestamp: timestampEnd.ISO8601Format(),
        params: [
          "expo.metrickit.estimate": "histogramMedian",
          "expo.metrickit.sample_count": MetricKitHistogram.sampleCount(buckets),
          "expo.metrickit.histogram": buckets.map(\.asParams),
          "expo.metrickit.window_begin": timestampBegin.ISO8601Format(),
          "expo.metrickit.window_end": timestampEnd.ISO8601Format(),
        ]
      )
    }
  }

  private var histograms: [(String, [MetricKitHistogramBucket])] {
    let all: [(String, [MetricKitHistogramBucket]?)] = [
      ("timeToFirstDraw", timeToFirstDraw),
      ("optimizedTimeToFirstDraw", optimizedTimeToFirstDraw),
      ("applicationResumeTime", applicationResumeTime),
      ("extendedLaunch", extendedLaunch),
      ("applicationHangTime", applicationHangTime),
    ]
    return all.compactMap { name, buckets in
      guard let buckets, !buckets.isEmpty else {
        return nil
      }
      return (name, buckets)
    }
  }
}

#if !os(tvOS)
import MetricKit

extension MetricKitHistogram {
  static func buckets(_ histogram: MXHistogram<UnitDuration>) -> [MetricKitHistogramBucket] {
    var result: [MetricKitHistogramBucket] = []
    while let bucket = histogram.bucketEnumerator.nextObject() as? MXHistogramBucket<UnitDuration> {
      result.append(
        MetricKitHistogramBucket(
          start: bucket.bucketStart.converted(to: .seconds).value,
          end: bucket.bucketEnd.converted(to: .seconds).value,
          count: bucket.bucketCount
        )
      )
    }
    return result
  }
}

extension MetricKitLaunchReport {
  init(payload: MXMetricPayload) {
    let launch = payload.applicationLaunchMetrics
    self.timeToFirstDraw = launch.map { MetricKitHistogram.buckets($0.histogrammedTimeToFirstDraw) }
    self.applicationResumeTime = launch.map { MetricKitHistogram.buckets($0.histogrammedApplicationResumeTime) }
    if #available(iOS 15.2, *), let launch {
      self.optimizedTimeToFirstDraw = MetricKitHistogram.buckets(launch.histogrammedOptimizedTimeToFirstDraw)
    } else {
      self.optimizedTimeToFirstDraw = nil
    }
    if #available(iOS 16.0, *), let launch {
      self.extendedLaunch = MetricKitHistogram.buckets(launch.histogrammedExtendedLaunch)
    } else {
      self.extendedLaunch = nil
    }
    self.applicationHangTime = payload.applicationResponsivenessMetrics.map {
      MetricKitHistogram.buckets($0.histogrammedApplicationHangTime)
    }
    self.appVersion = payload.latestApplicationVersion
    self.includesMultipleAppVersions = payload.includesMultipleApplicationVersions
    self.timestampBegin = payload.timeStampBegin
    self.timestampEnd = payload.timeStampEnd
    self.ingestedAt = Date.now
  }
}
#endif
