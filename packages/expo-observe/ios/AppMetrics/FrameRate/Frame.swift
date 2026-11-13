struct Frame: Sendable {
  let timestamp: TimeInterval
  let targetTimestamp: TimeInterval
  let duration: TimeInterval

  var targetDuration: TimeInterval {
    return targetTimestamp - timestamp
  }

  static var zero: Self {
    return Frame(timestamp: 0, targetTimestamp: 0, duration: 0)
  }

  func equal(duration: TimeInterval) -> Bool {
    return abs(self.duration - duration) >= FrameRateMetrics.refreshRateDurationThreshold
  }
}
