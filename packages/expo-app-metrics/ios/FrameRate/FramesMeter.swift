@AppMetricsActor
final class FramesMeter: MetricReporter, FrameRateObserverDelegate, Sendable {
  private var frameRateObserver: FrameRateObserver?
  private var previousFrame: Frame = .zero
  internal var metrics: FrameRateMetrics = .zero

  func startMonitoring() {
    if frameRateObserver == nil {
      frameRateObserver = FrameRateObserver(delegate: self)
    }
  }

  func stopMonitoring() {
    frameRateObserver = nil
  }

  // MARK: - FrameRateObserverDelegate

  @MainActor
  func onDisplayLinkUpdate(_ frame: Frame) {
    // The display link operates on the main thread.
    // Switch to the app metrics actor to ensure proper isolation and offload calculations to another thread.
    AppMetricsActor.isolated { [weak self] in
      // TODO: Skip if the app went to background
      guard let self else {
        return
      }
      guard self.previousFrame.timestamp != .zero else {
        self.previousFrame = frame
        return
      }
      var actualFrameDuration = frame.timestamp - previousFrame.timestamp

      let fpsIsChanging = !frame.equal(duration: previousFrame.duration) || !frame.equal(duration: frame.targetDuration)

      let noMoreThanOneFrameDropped = actualFrameDuration < 2 * frame.targetDuration + FrameRateMetrics.refreshRateDurationThreshold

      if fpsIsChanging && noMoreThanOneFrameDropped {
        actualFrameDuration = frame.targetDuration
      }

      let newMetrics = self.metrics + FrameRateMetrics.metrics(frameDuration: actualFrameDuration, targetDuration: frame.targetDuration)

      if self.metrics.droppedFrames != newMetrics.droppedFrames {
        print(newMetrics)
      }

      self.metrics = newMetrics
      self.previousFrame = frame
    }
  }
}
