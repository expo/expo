package expo.modules.audio

import android.content.Context
import expo.modules.kotlin.AppContext
import io.mockk.mockk
import io.mockk.every
import io.mockk.Runs
import io.mockk.just
import io.mockk.verify
import io.mockk.verifyOrder
import org.junit.Assert.assertEquals
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

  @Test
  fun nativePauseEmitsAnEventAfterChangingState() {
    val recorder = makeRecorder()
    val sessionId = recorder.notificationSessionId
    recorder.notificationOptions = RecordingNotificationOptions(
      buttons = listOf(
        RecordingNotificationButton("pause"), RecordingNotificationButton("stop", preventDefault = true)
      )
    )
    recorder.onStartListeningToEvent("recordingNotificationAction")
    recorder.handleNotificationAction("pause", sessionId)
    assertTrue(recorder.isPaused)
    verifyOrder {
      recorder.pauseRecording()
      recorder.emit("recordingNotificationAction", mapOf("action" to "pause", "sessionId" to sessionId, "defaultPrevented" to false))
    }
    recorder.handleNotificationAction("resume", sessionId)
    assertTrue(recorder.isRecording)
    recorder.handleNotificationAction("stop", sessionId)
    assertTrue(recorder.isPrepared)
    assertTrue(recorder.isRecording)
    verify {
      recorder.emit("recordingNotificationAction", mapOf("action" to "stop", "sessionId" to sessionId, "defaultPrevented" to true))
    }
  }

  @Test
  fun customButtonReportsAnEventWithoutChangingState() {
    val recorder = makeRecorder()
    val sessionId = recorder.notificationSessionId
    recorder.notificationOptions = RecordingNotificationOptions(
      buttons = listOf(
        RecordingNotificationButton("bookmark", "Bookmark"), RecordingNotificationButton("stop")
      )
    )
    recorder.handleNotificationAction("bookmark", sessionId)
    assertTrue(recorder.isRecording)
    verify { recorder.emit("recordingNotificationAction", mapOf("action" to "bookmark", "sessionId" to sessionId, "defaultPrevented" to false)) }
  }

  @Test
  fun preventedPauseLeavesTheRecorderRunning() {
    val recorder = makeRecorder()
    recorder.notificationOptions = RecordingNotificationOptions(
      buttons = listOf(
        RecordingNotificationButton("pause", preventDefault = true), RecordingNotificationButton("stop")
      )
    )
    recorder.handleNotificationAction("pause", recorder.notificationSessionId)
    assertTrue(recorder.isRecording)
  }

  @Test
  fun nativeStopEmitsEvenAfterTheRecorderIsStopped() {
    val recorder = makeRecorder()
    val sessionId = recorder.notificationSessionId
    var preparedWhenEventArrived = true
    every { recorder.emit(any<String>(), any<Any>()) } answers {
      preparedWhenEventArrived = recorder.isPrepared
    }
    recorder.handleNotificationAction("stop", sessionId) {
      recorder.isPrepared = false
      recorder.isRecording = false
    }
    assertFalse(preparedWhenEventArrived)
    verify {
      recorder.emit("recordingNotificationAction", mapOf("action" to "stop", "sessionId" to sessionId, "defaultPrevented" to false))
    }
  }

  @Test
  fun serviceCanKeepStoppingAllRecordersByDefault() {
    val recorder = makeRecorder()
    var stoppedAll = false
    recorder.handleNotificationAction("stop", recorder.notificationSessionId) { stoppedAll = true }
    assertTrue(stoppedAll)
  }

  @Test
  fun preventedStopWarnsWhenNoListenerIsRegistered() {
    val recorder = makeRecorder()
    recorder.notificationOptions = RecordingNotificationOptions(
      buttons = listOf(
        RecordingNotificationButton("stop", preventDefault = true)
      )
    )
    val logger = recorder.appContext!!.jsLogger!!
    recorder.onStartListeningToEvent("recordingNotificationAction")
    recorder.onStopListeningToEvent("recordingNotificationAction")
    recorder.handleNotificationAction("stop", recorder.notificationSessionId)
    assertTrue(recorder.isRecording)
    verify { logger.warn(match { it.contains("Stop") && it.contains("listener") }) }
  }

  @Test
  fun removedButtonsAndStaleSessionsCannotEmitEvents() {
    val recorder = makeRecorder()
    recorder.handleNotificationAction("bookmark", recorder.notificationSessionId)
    recorder.notificationOptions = RecordingNotificationOptions(
      buttons = listOf(
        RecordingNotificationButton("bookmark", "Bookmark"), RecordingNotificationButton("stop")
      )
    )
    recorder.handleNotificationAction("bookmark", "stale-session")
    verify(exactly = 0) { recorder.emit("recordingNotificationAction", any<Any>()) }
  }

  @Test
  fun pauseButtonBecomesResumeWithTheConfiguredResumeLabel() {
    val options = RecordingNotificationOptions(
      resumeButtonTitle = "Continue",
      buttons = listOf(
        RecordingNotificationButton("pause", "Take a break"),
        RecordingNotificationButton("stop")
      )
    )
    assertEquals("Take a break", options.resolvedButtons(false)[0].title)
    assertEquals("resume", options.resolvedButtons(true)[0].id)
    assertEquals("Continue", options.resolvedButtons(true)[0].title)
  }

  @Test(expected = InvalidRecordingNotificationButtonsException::class)
  fun buttonsCannotExceedAndroidLimit() {
    RecordingNotificationOptions(
      buttons = listOf(
        RecordingNotificationButton("pause"),
        RecordingNotificationButton("bookmark", "Bookmark"),
        RecordingNotificationButton("mark", "Mark"),
        RecordingNotificationButton("stop")
      )
    ).validate()
  }

  @Test(expected = InvalidRecordingNotificationButtonsException::class)
  fun buttonIdsMustBeUnique() {
    RecordingNotificationOptions(
      buttons = listOf(
        RecordingNotificationButton("stop"),
        RecordingNotificationButton("stop")
      )
    ).validate()
  }

  @Test(expected = InvalidRecordingNotificationButtonsException::class)
  fun pauseAndResumeShareOneButtonSlot() {
    RecordingNotificationOptions(
      buttons = listOf(
        RecordingNotificationButton("pause"),
        RecordingNotificationButton("resume"),
        RecordingNotificationButton("stop")
      )
    ).validate()
  }

  @Test(expected = InvalidRecordingNotificationButtonsException::class)
  fun customButtonsNeedATitle() {
    RecordingNotificationOptions(
      buttons = listOf(
        RecordingNotificationButton("bookmark"),
        RecordingNotificationButton("stop")
      )
    ).validate()
  }

  @Test(expected = InvalidRecordingNotificationButtonsException::class)
  fun buttonIdsCannotBeBlank() {
    RecordingNotificationOptions(
      buttons = listOf(
        RecordingNotificationButton(" ", "Bookmark"),
        RecordingNotificationButton("stop")
      )
    ).validate()
  }

  @Test(expected = InvalidRecordingNotificationButtonsException::class)
  fun theStopButtonMustRemainAvailable() {
    RecordingNotificationOptions(buttons = listOf(RecordingNotificationButton("pause"))).validate()
  }
}
