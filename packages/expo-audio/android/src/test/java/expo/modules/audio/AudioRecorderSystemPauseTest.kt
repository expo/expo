package expo.modules.audio

import android.content.Context
import expo.modules.kotlin.AppContext
import io.mockk.mockk
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AudioRecorderSystemPauseTest {
  private fun makeRecordingRecorder(): AudioRecorder {
    val options = RecordingOptions(
      extension = ".m4a",
      sampleRate = null,
      numberOfChannels = null,
      bitRate = null,
      outputFormat = null,
      audioEncoder = null,
      maxFileSize = null,
      audioSource = null,
      directory = null
    )
    return AudioRecorder(mockk<Context>(relaxed = true), mockk<AppContext>(relaxed = true), options).apply {
      record()
    }
  }

  @Test
  fun resumesRecorderPausedBySystem() {
    val recorder = makeRecordingRecorder()

    recorder.pauseForSystem()
    recorder.resumeAfterSystemPause()

    assertTrue(recorder.isRecording)
  }

  @Test
  fun doesNotResumeRecorderPausedByUser() {
    val recorder = makeRecordingRecorder()

    recorder.pauseRecording()
    recorder.resumeAfterSystemPause()

    assertFalse(recorder.isRecording)
  }

  @Test
  fun doesNotResumeRecorderPausedByUserDuringSystemPause() {
    val recorder = makeRecordingRecorder()

    recorder.pauseForSystem()
    recorder.pauseRecording()
    recorder.resumeAfterSystemPause()

    assertFalse(recorder.isRecording)
  }
}
