// Copyright 2025-present 650 Industries. All rights reserved.

/**
 A lightweight recorder that accumulates frame rate metrics independently.
 Multiple recorders can be active simultaneously (e.g., one for the main session, one per screen),
 each tracking its own metrics. Call `start()` to begin recording and `stop()` to finish
 and retrieve the accumulated metrics.
 */
public final class FrameMetricsRecorder: Sendable {
  @AppMetricsActor
  public private(set) var metrics: FrameRateMetrics = .zero

  @AppMetricsActor
  private var previousFrame: Frame = .zero

  public init() {}

  /// Starts recording frame metrics from the shared display link.
  @AppMetricsActor
  public func start() {
    FrameRateMonitor.shared.addRecorder(self)
  }

  /// Stops recording frame metrics and returns the accumulated metrics since the last `start()` call.
  /// Resets the state so the recorder can be reused for a new recording session.
  @AppMetricsActor
  @discardableResult
  public func stop() -> FrameRateMetrics {
    FrameRateMonitor.shared.removeRecorder(self)
    defer {
      metrics = .zero
      previousFrame = .zero
    }
    return metrics
  }

  @AppMetricsActor
  func processFrame(_ frame: Frame) {
    guard previousFrame.timestamp != .zero else {
      previousFrame = frame
      return
    }
    var actualFrameDuration = frame.timestamp - previousFrame.timestamp

    let fpsIsChanging = !frame.equal(duration: previousFrame.duration) || !frame.equal(duration: frame.targetDuration)

    let noMoreThanOneFrameDropped = actualFrameDuration < 2 * frame.targetDuration + FrameRateMetrics.refreshRateDurationThreshold

    if fpsIsChanging && noMoreThanOneFrameDropped {
      actualFrameDuration = frame.targetDuration
    }

    metrics = metrics + FrameRateMetrics.metrics(frameDuration: actualFrameDuration, targetDuration: frame.targetDuration)
    previousFrame = frame
  }
}
