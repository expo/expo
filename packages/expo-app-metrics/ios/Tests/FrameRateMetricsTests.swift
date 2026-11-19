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
