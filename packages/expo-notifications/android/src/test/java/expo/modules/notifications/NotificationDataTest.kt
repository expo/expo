package expo.modules.notifications

import expo.modules.notifications.notifications.model.NotificationData
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
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
      "body" to "My Body",
      "categoryId" to "myCategory",
      "subtitle" to "My Subtitle",
      "badge" to "1"
    )
    val notificationData = NotificationData(data)
    assertEquals("My Title", notificationData.title)
    assertEquals("My Message", notificationData.message)
    assertEquals("default", notificationData.sound)
    assertEquals("My Body", notificationData.body)
    assertEquals("myCategory", notificationData.categoryId)
    assertEquals("My Subtitle", notificationData.subText)
    assertEquals(1, notificationData.badge)
  }

  @Test
  fun testVibrationPattern() {
    val notificationData = NotificationData(mapOf("vibrate" to "[100, 200, 300]"))
    assertArrayEquals(longArrayOf(100, 200, 300), notificationData.vibrationPattern)
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
  }
}