import Foundation
import Testing

@testable import ExpoAppMetrics

@Suite("FrameRateMetrics")
struct FrameRateMetricsTests {
  @Test(arguments: [
    (1.0, 0.0), (1.0, -1.0), (0.0, 1.0), (-1.0, 1.0),
    (Double.infinity, 1.0), (-Double.infinity, 1.0), (Double.nan, 1.0),
    (1.0, Double.nan), (1.0, Double.infinity),
    (Double.greatestFiniteMagnitude, Double.leastNonzeroMagnitude),
  ])
  func `discards invalid samples`(frameDuration: Double, targetDuration: Double) {
    #expect(FrameRateMetrics.metrics(frameDuration: frameDuration, targetDuration: targetDuration) == .zero)
  }

  @Test(arguments: [60.0, 120.0])
  func `preserves normal frames and refresh thresholds`(rate: Double) {
    let duration = 1 / rate
    let normal = FrameRateMetrics.metrics(frameDuration: duration, targetDuration: duration)
    #expect(normal.renderedFrames == 1)
    #expect(normal.expectedFrames == 1)
    #expect(normal.droppedFrames == 0)
    let threshold = FrameRateMetrics.metrics(
      frameDuration: duration + FrameRateMetrics.refreshRateDurationThreshold,
      targetDuration: duration
    )
    #expect(threshold.expectedFrames == 1)
    #expect(threshold.droppedFrames == 0)
  }

  @Test
  func `preserves slow and frozen frame counts`() {
    let slow = FrameRateMetrics.metrics(frameDuration: 0.05, targetDuration: 1 / 60)
    #expect(slow.expectedFrames == 3)
    #expect(slow.droppedFrames == 2)
    #expect(slow.slowFrames == 1)
    let frozen = FrameRateMetrics.metrics(frameDuration: 0.75, targetDuration: 1 / 60)
    #expect(frozen.expectedFrames == 45)
    #expect(frozen.droppedFrames == 44)
    #expect(frozen.frozenFrames == 1)
  }

  @Test
  func `recovers after invalid samples without corrupting aggregates`() {
    let normal = FrameRateMetrics.metrics(frameDuration: 0.016, targetDuration: 0.016)
    let aggregate = normal + FrameRateMetrics.metrics(frameDuration: .nan, targetDuration: 0.016) + normal
    #expect(aggregate.renderedFrames == 2)
    #expect(aggregate.expectedFrames == 2)
    #expect(aggregate.droppedFrames == 0)
    #expect(aggregate.sessionDuration == 0.032)
    #expect(aggregate.freezeTime == 0)
  }
}
