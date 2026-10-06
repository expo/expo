package expo.modules.appmetrics.frames

import org.junit.Assert.*
import org.junit.Test

class FrameMetricsRecorderTest {
  @Test
  fun `starts with zero metrics`() {
    val recorder = FrameMetricsRecorder()
    val record = recorder.stop()
    assertEquals(0, record.renderedFrames)
    assertEquals(0, record.expectedFrames)
    assertEquals(0, record.droppedFrames)
    assertEquals(0, record.slowFrames)
    assertEquals(0, record.frozenFrames)
    assertEquals(0, record.freezeTimeMs)
  }

  @Test
  fun `accumulates metrics from on-time frames`() {
    val recorder = FrameMetricsRecorder()

    // 16ms frame — on time
    recorder.processFrame(16)
    recorder.processFrame(16)

    val record = recorder.stop()
    assertEquals(2, record.renderedFrames)
    assertEquals(2, record.expectedFrames)
    assertEquals(0, record.droppedFrames)
    assertEquals(0, record.slowFrames)
    assertEquals(0, record.frozenFrames)
  }

  @Test
  fun `detects slow frames`() {
    val recorder = FrameMetricsRecorder()

    // 50ms frame — slow (>=17ms) but not frozen
    recorder.processFrame(50)

    val record = recorder.stop()
    assertEquals(1, record.renderedFrames)
    assertEquals(1, record.slowFrames)
    assertEquals(0, record.frozenFrames)
  }

  @Test
  fun `detects dropped frames from a slow frame`() {
    val recorder = FrameMetricsRecorder()

    // 100ms frame — expected ~6 frames at 17ms each, so ~5 dropped
    recorder.processFrame(100)

    val record = recorder.stop()
    assertEquals(1, record.renderedFrames)
    assertTrue("Expected dropped frames > 0", record.droppedFrames > 0)
    assertEquals(record.expectedFrames - 1, record.droppedFrames)
  }

  @Test
  fun `detects frozen frames`() {
    val recorder = FrameMetricsRecorder()

    // 800ms frame — over the 700ms frozen threshold
    recorder.processFrame(800)

    val record = recorder.stop()
    assertEquals(1, record.renderedFrames)
    assertEquals(1, record.frozenFrames)
    assertEquals(1, record.slowFrames)
    assertTrue("Expected freezeTimeMs > 700", record.freezeTimeMs > 700)
  }

  @Test
  fun `accumulates freeze time`() {
    val recorder = FrameMetricsRecorder()

    // Two slow frames: 50ms and 100ms
    // Freeze time = (50 - 17) + (100 - 17) = 33 + 83 = 116
    recorder.processFrame(50)
    recorder.processFrame(100)

    val record = recorder.stop()
    assertEquals(116, record.freezeTimeMs)
  }

  @Test
  fun `stop returns metrics and resets`() {
    val recorder = FrameMetricsRecorder()

    recorder.processFrame(100)

    val first = recorder.stop()
    assertEquals(1, first.renderedFrames)
    assertTrue(first.droppedFrames > 0)

    // After stop, state is reset
    val second = recorder.stop()
    assertEquals(0, second.renderedFrames)
    assertEquals(0, second.droppedFrames)
  }

  @Test
  fun `can be reused after stop`() {
    val recorder = FrameMetricsRecorder()

    // First recording — slow frame
    recorder.processFrame(100)
    val first = recorder.stop()
    assertTrue(first.droppedFrames > 0)

    // Second recording — on-time frames
    recorder.processFrame(16)
    recorder.processFrame(16)
    val second = recorder.stop()
    assertEquals(2, second.renderedFrames)
    assertEquals(0, second.droppedFrames)
  }
}
