package expo.modules.audio

import android.content.Context
import android.content.res.Resources
import android.util.Log
import expo.modules.audio.service.getRecordingNotificationIcon
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.unmockkStatic
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test

class RecordingNotificationIconTest {
  private val context = mockk<Context>()
  private val resources = mockk<Resources>()

  @Before
  fun setUp() {
    mockkStatic(Log::class)
    every { Log.w(any(), any<String>()) } returns 0
    every { context.packageName } returns "test.audio"
    every { context.resources } returns resources
    every { resources.getIdentifier(any(), "drawable", "test.audio") } returns 0
  }

  @After
  fun tearDown() {
    unmockkStatic(Log::class)
  }

  @Test
  fun explicitDrawableTakesPriority() {
    every { resources.getIdentifier("memo_icon", "drawable", "test.audio") } returns 101
    every { resources.getIdentifier("notification_icon", "drawable", "test.audio") } returns 103
    assertEquals(101, getRecordingNotificationIcon(context, "memo_icon"))
  }

  @Test
  fun missingDrawableFallsBackToTheDefaultDrawable() {
    every { resources.getIdentifier("notification_icon", "drawable", "test.audio") } returns 103
    assertEquals(103, getRecordingNotificationIcon(context, "missing_icon"))
  }

  @Test
  fun defaultDrawablePrecedesTheSystemMicrophoneIcon() {
    every { resources.getIdentifier("notification_icon", "drawable", "test.audio") } returns 103
    assertEquals(103, getRecordingNotificationIcon(context, null))
  }

  @Test
  fun absentAppIconsUseTheSystemMicrophoneIcon() {
    assertEquals(android.R.drawable.ic_btn_speak_now, getRecordingNotificationIcon(context, null))
  }
}
