package expo.modules.audio

import android.content.Context
import expo.modules.kotlin.AppContext
import io.mockk.mockk
import io.mockk.every
import io.mockk.Runs
import io.mockk.just
import io.mockk.spyk
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AudioRecorderNotificationTest {
  private fun makeRecorder(): AudioRecorder {
    val appContext = mockk<AppContext>(relaxed = true)
    every { appContext.runtime.appContext } returns appContext
    every { appContext.mainQueue } returns CoroutineScope(Dispatchers.Unconfined)
    val recorder = spyk(
      AudioRecorder(
        mockk<Context>(relaxed = true),
        appContext,
        RecordingOptions(
          extension = ".m4a",
          sampleRate = null,
          numberOfChannels = null,
          bitRate = null,
          outputFormat = null,
          audioEncoder = null,
          maxFileSize = null,
          isMeteringEnabled = false,
          audioSource = null,
          directory = null
        )
      )
    )
    every { recorder.emit(any<String>(), any<Any>()) } just Runs
    return recorder.apply {
      isPrepared = true
      record()
    }
  }

  @Test
  fun pauseAndResumeUpdateTheRecorderWithoutJavaScript() {
    val recorder = makeRecorder()
    recorder.notificationOptions = RecordingNotificationOptions(showPauseResume = true)

    recorder.handleNotificationAction("pause", recorder.notificationSessionId)
    assertTrue(recorder.isPaused)
    assertFalse(recorder.isRecording)

    recorder.handleNotificationAction("resume", recorder.notificationSessionId)
    assertTrue(recorder.isRecording)
    assertFalse(recorder.isPaused)
  }

  @Test
  fun staleSessionAndUnconfiguredPauseCannotControlRecorder() {
    val recorder = makeRecorder()

    recorder.handleNotificationAction("pause", recorder.notificationSessionId)
    assertTrue(recorder.isRecording)

    recorder.notificationOptions = RecordingNotificationOptions(showPauseResume = true)
    recorder.handleNotificationAction("pause", "previous-session")
    assertTrue(recorder.isRecording)

    recorder.isPrepared = false
    recorder.handleNotificationAction("pause", recorder.notificationSessionId)
    assertTrue(recorder.isRecording)
  }
}
