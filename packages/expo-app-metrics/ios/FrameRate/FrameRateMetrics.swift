public struct FrameRateMetrics: Metrics, CustomStringConvertible, Equatable, Sendable {
  public enum MetricKeys: String, MetricKey {
    case renderedFrames
    case expectedFrames
    case droppedFrames
    case frozenFrames
    case slowFrames
    case freezeTime
    case sessionDuration
  }

  public static let category: Metric.Category? = .frameRate

  /**
   Threshold in seconds to recognize a frame as slow.
   */
  private static let slowFrameThreshold: TimeInterval = 0.017

  /**
   Threshold in seconds to recognize a frame as frozen.
   */
  private static let frozenFrameThreshold: TimeInterval = 0.7

  /**
   Threshold below which a frame is still considered as valid, i.e. rendered in time.
   */
  static let refreshRateDurationThreshold: TimeInterval = 0.001

  let renderedFrames: UInt
  let expectedFrames: UInt
  let droppedFrames: UInt
  let frozenFrames: UInt
  let slowFrames: UInt
  let freezeTime: TimeInterval
  let sessionDuration: TimeInterval

  /**
   Frozen frames divided by the number of rendered frames.
   */
  var frozenFramesRatio: Double {
    guard renderedFrames > 0 else {
      return 0.0
    }
    return Double(frozenFrames) / Double(renderedFrames)
  }

  /**
   Slow frames divided by the number of rendered frames.
   */
  var slowFramesRatio: Double {
    guard renderedFrames > 0 else {
      return 0.0
    }
    return Double(slowFrames) / Double(renderedFrames)
  }

  /**
   Dropped frames divided by expected frames.
   */
  var droppedFramesRatio: Double {
    guard expectedFrames > 0 else {
      return 0.0
    }
    return Double(droppedFrames) / Double(expectedFrames)
  }

  public var description: String {
    return """
FrameRateMetrics {
  \(expectedFrames) expected,
  \(renderedFrames) rendered,
  \(droppedFrames) dropped,
  \(slowFrames) slow,
  \(frozenFrames) frozen
}
"""
  }

  // MARK: - Encodable

  enum CodingKeys: String, CodingKey {
    case renderedFrames
    case expectedFrames
    case droppedFrames
    case frozenFrames
    case slowFrames
    case freezeTime
    case sessionDuration
  }

  // MARK: - Statics

  static var zero: FrameRateMetrics {
    return FrameRateMetrics(
      renderedFrames: 0,
      expectedFrames: 0,
      droppedFrames: 0,
      frozenFrames: 0,
      slowFrames: 0,
      freezeTime: 0,
      sessionDuration: 0
    )
  }

  static func metrics(frameDuration: TimeInterval, targetDuration: TimeInterval) -> FrameRateMetrics {
    let expectedFrames, droppedFrames: UInt

    if frameDuration > (targetDuration + refreshRateDurationThreshold) {
      expectedFrames = UInt(round(frameDuration / targetDuration))
      droppedFrames = expectedFrames - 1
    } else {
      expectedFrames = 1
      droppedFrames = 0
    }

    // TODO: Should we take low battery mode into account?
    return FrameRateMetrics(
      renderedFrames: 1,
      expectedFrames: expectedFrames,
      droppedFrames: droppedFrames,
      frozenFrames: UInt(frameDuration >= frozenFrameThreshold ? 1 : 0),
      slowFrames: UInt(frameDuration >= slowFrameThreshold ? 1 : 0),
      freezeTime: TimeInterval(frameDuration - targetDuration),
      sessionDuration: TimeInterval(frameDuration)
    )
  }

  static func + (lhs: Self, rhs: Self) -> Self {
    return FrameRateMetrics(
      renderedFrames: lhs.renderedFrames + rhs.renderedFrames,
      expectedFrames: lhs.expectedFrames + rhs.expectedFrames,
      droppedFrames: lhs.droppedFrames + rhs.droppedFrames,
      frozenFrames: lhs.frozenFrames + rhs.frozenFrames,
      slowFrames: lhs.slowFrames + rhs.slowFrames,
      freezeTime: lhs.freezeTime + rhs.freezeTime,
      sessionDuration: lhs.sessionDuration + rhs.sessionDuration
    )
  }
}
