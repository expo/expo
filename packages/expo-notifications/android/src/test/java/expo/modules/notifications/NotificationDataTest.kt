package expo.modules.notifications

import expo.modules.notifications.notifications.model.NotificationData
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class NotificationDataTest {

  @Test
  fun testBasicData() {
    val data = mapOf(
      "title" to "My Title",
      "message" to "My Message",
      "sound" to "default",
      "body" to "{\"key\":\"value\"}",
      "color" to "#FF0000",
      "categoryId" to "myCategory",
      "subtitle" to "My Subtitle",
      "badge" to "1"
    )
    val notificationData = NotificationData(data)
    assertEquals("My Title", notificationData.title)
    assertEquals("My Message", notificationData.message)
    assertEquals("default", notificationData.sound)
    assertNotNull(notificationData.body)
    assertEquals("myCategory", notificationData.categoryId)
    assertEquals("My Subtitle", notificationData.subText)
    assertEquals("#FF0000", notificationData.color)
    assertEquals(1, notificationData.badge)
    assertFalse(notificationData.shouldPlayDefaultSound)
  }

  @Test
  fun testVibrationPattern() {
    val notificationData = NotificationData(mapOf("vibrate" to "[100, 200, 300]"))
    assertArrayEquals(longArrayOf(100, 200, 300), notificationData.vibrationPattern)
    assertFalse(notificationData.shouldUseDefaultVibrationPattern)
  }

  @Test
  fun testVibrationPatternInvalidFormat() {
    val notificationData = NotificationData(mapOf("vibrate" to "invalid"))
    assertNull(notificationData.vibrationPattern)
  }

  @Test
  fun testFlags() {
    val data = mapOf(
      "vibrate" to "true",
      "autoDismiss" to "false",
      "sticky" to "true"
    )
    val notificationData = NotificationData(data)
    assertEquals(true, notificationData.shouldUseDefaultVibrationPattern)
    assertEquals(false, notificationData.autoDismiss)
    assertEquals(true, notificationData.sticky)

    assertEquals(true, notificationData.shouldPlayDefaultSound)
  }
}
