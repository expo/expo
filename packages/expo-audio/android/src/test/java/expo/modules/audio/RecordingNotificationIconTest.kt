package expo.modules.audio

import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.content.res.Resources
import android.os.Bundle
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
  private val packageManager = mockk<PackageManager>()
  private val metadata = mockk<Bundle>()

  @Before
  fun setUp() {
    mockkStatic(Log::class)
    every { Log.w(any(), any<String>()) } returns 0
    every { context.packageName } returns "test.audio"
    every { context.resources } returns resources
    every { context.packageManager } returns packageManager
    every { resources.getIdentifier(any(), "drawable", "test.audio") } returns 0
    val info = ApplicationInfo().apply { metaData = metadata }
    every { packageManager.getApplicationInfo("test.audio", PackageManager.GET_META_DATA) } returns info
    every { metadata.getInt("expo.modules.audio.foreground_service_icon", 0) } returns 0
  }

  @After
  fun tearDown() {
    unmockkStatic(Log::class)
  }

  @Test
  fun explicitDrawableTakesPriority() {
    every { resources.getIdentifier("memo_icon", "drawable", "test.audio") } returns 101
    every { metadata.getInt(any(), 0) } returns 102
    assertEquals(101, getRecordingNotificationIcon(context, "memo_icon"))
  }

  @Test
  fun missingDrawableFallsBackToManifestMetadata() {
    every { metadata.getInt(any(), 0) } returns 102
    assertEquals(102, getRecordingNotificationIcon(context, "missing_icon"))
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

  @Test
  fun unreadableMetadataStillUsesTheDefaultDrawable() {
    every { packageManager.getApplicationInfo(any<String>(), any<Int>()) } throws PackageManager.NameNotFoundException()
    every { resources.getIdentifier("notification_icon", "drawable", "test.audio") } returns 103
    assertEquals(103, getRecordingNotificationIcon(context, null))
  }
}
