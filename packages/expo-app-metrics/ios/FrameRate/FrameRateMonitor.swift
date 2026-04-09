// Copyright 2025-present 650 Industries. All rights reserved.

/**
 A singleton monitor that owns the display link and fans out frame updates
 to all registered `FrameMetricsRecorder` instances. The display link is
 automatically started when the first recorder is added and stopped when the last is removed.
 */
@AppMetricsActor
final class FrameRateMonitor: FrameRateObserverDelegate, Sendable {
  static let shared = FrameRateMonitor()

  private var frameRateObserver: FrameRateObserver?
  private var recorders: [WeakRecorder] = []

  private init() {}

  func addRecorder(_ recorder: FrameMetricsRecorder) {
    recorders.append(WeakRecorder(recorder))
    startMonitoringIfNeeded()
  }

  func removeRecorder(_ recorder: FrameMetricsRecorder) {
    recorders.removeAll { $0.recorder === recorder || $0.recorder == nil }
    stopMonitoringIfEmpty()
  }

  // MARK: - Private

  private func removeReleasedRecorders() {
    recorders.removeAll { $0.recorder == nil }
  }

  private func startMonitoringIfNeeded() {
    if frameRateObserver == nil {
      frameRateObserver = FrameRateObserver(delegate: self)
    }
  }

  private func stopMonitoringIfEmpty() {
    removeReleasedRecorders()
    if recorders.isEmpty {
      frameRateObserver = nil
    }
  }

  // MARK: - FrameRateObserverDelegate

  @MainActor
  func onDisplayLinkUpdate(_ frame: Frame) {
    AppMetricsActor.isolated { [weak self] in
      guard let self else { return }
      for entry in self.recorders {
        entry.recorder?.processFrame(frame)
      }
    }
  }
}

private struct WeakRecorder {
  weak var recorder: FrameMetricsRecorder?

  init(_ recorder: FrameMetricsRecorder) {
    self.recorder = recorder
  }
}
