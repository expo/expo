import Testing

@testable import ExpoAppMetrics

@AppMetricsActor
@Suite("FrameMetricsRecorder")
struct FrameMetricsRecorderTests {
  // Target frame duration for a 60fps display
  private let target: TimeInterval = 0.016

  // Helper to create a frame at a given timestamp with standard 60fps duration.
  // Timestamps must be non-zero since zero is used as the sentinel for "no previous frame".
  private func frame(at timestamp: TimeInterval) -> Frame {
    Frame(timestamp: timestamp, targetTimestamp: timestamp + target, duration: target)
  }

  @Test
  func `starts with zero metrics`() {
    let recorder = FrameMetricsRecorder()
    #expect(recorder.metrics == .zero)
  }

  @Test
  func `first frame sets baseline without accumulating`() {
    let recorder = FrameMetricsRecorder()

    recorder.processFrame(frame(at: 1.0))
    #expect(recorder.metrics == .zero)
  }

  @Test
  func `accumulates metrics from on-time frames`() {
    let recorder = FrameMetricsRecorder()

    recorder.processFrame(frame(at: 1.0))
    recorder.processFrame(frame(at: 1.016))
    recorder.processFrame(frame(at: 1.032))

    #expect(recorder.metrics.renderedFrames == 2)
    #expect(recorder.metrics.droppedFrames == 0)
    #expect(recorder.metrics.slowFrames == 0)
    #expect(recorder.metrics.frozenFrames == 0)
  }

  @Test
  func `detects dropped frames from a slow frame`() {
    let recorder = FrameMetricsRecorder()

    recorder.processFrame(frame(at: 1.0))
    // 100ms gap — well over 2 * 16ms, so normalization is skipped
    recorder.processFrame(frame(at: 1.1))

    #expect(recorder.metrics.renderedFrames == 1)
    #expect(recorder.metrics.droppedFrames > 0)
    #expect(recorder.metrics.slowFrames == 1)
  }

  @Test
  func `detects frozen frames`() {
    let recorder = FrameMetricsRecorder()

    recorder.processFrame(frame(at: 1.0))
    // 800ms gap — over the 700ms frozen threshold
    recorder.processFrame(frame(at: 1.8))

    #expect(recorder.metrics.frozenFrames == 1)
    #expect(recorder.metrics.slowFrames == 1)
    #expect(recorder.metrics.freezeTime > 0.7)
  }

  @Test
  func `normalizes single-frame jitter during stable fps`() {
    let recorder = FrameMetricsRecorder()

    recorder.processFrame(frame(at: 1.0))
    // 25ms gap — slightly over target but under 2 * 16ms,
    // and FPS is stable, so normalization kicks in
    recorder.processFrame(frame(at: 1.025))

    #expect(recorder.metrics.renderedFrames == 1)
    #expect(recorder.metrics.droppedFrames == 0)
  }

  @Test
  func `stop returns accumulated metrics and resets`() {
    let recorder = FrameMetricsRecorder()

    recorder.processFrame(frame(at: 1.0))
    recorder.processFrame(frame(at: 1.1))

    let metrics = recorder.stop()
    #expect(metrics.renderedFrames == 1)
    #expect(metrics.droppedFrames > 0)
    #expect(recorder.metrics == .zero)
  }

  @Test
  func `can be reused after stop`() {
    let recorder = FrameMetricsRecorder()

    // First recording — slow frame
    recorder.processFrame(frame(at: 1.0))
    recorder.processFrame(frame(at: 1.1))
    let first = recorder.stop()
    #expect(first.renderedFrames == 1)
    #expect(first.droppedFrames > 0)

    // Second recording — on-time frames, starts fresh
    recorder.processFrame(frame(at: 2.0))
    recorder.processFrame(frame(at: 2.016))
    recorder.processFrame(frame(at: 2.032))
    #expect(recorder.metrics.renderedFrames == 2)
    #expect(recorder.metrics.droppedFrames == 0)
  }
}
