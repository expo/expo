package expo.modules.notifications

import android.net.Uri
import org.junit.Assert.*
import org.junit.Test
import java.io.*
import org.json.JSONObject
import expo.modules.notifications.notifications.enums.NotificationPriority
import expo.modules.notifications.notifications.model.NotificationContent
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.mockkConstructor
import org.junit.Before

const val mockData = "{\"key\":\"value\"}"

class NotificationContentSerializationTest {

  @Before
  fun setup() {
    // need to fake some Android classes
    mockkStatic(Uri::class)
    every { Uri.parse(any()) } returns mockk(relaxed = true)

    mockkConstructor(JSONObject::class)
    every { anyConstructed<JSONObject>().toString() } returns mockData
  }

  @Test
  fun testSerializationWithNullValues() {
    val originalContent = NotificationContent.Builder()
      .setTitle(null)
      .setText(null)
      .setSubtitle(null)
      .setBadgeCount(null)
      .setSound(null)
      .setBody(null)
      .setPriority(null)
      .setColor(null)
      .setCategoryId(null)
      .build()

    // Serialize and deserialize
    val deserializedContent = serializeAndDeserialize(originalContent)

    // Assert equality
    assertNotificationContentEquals(originalContent, deserializedContent)
  }

  @Test
  fun testDeserializationOfPreviouslySerializedContent() {
    val base64EncodedSerialized = "rO0ABXNyAEJleHBvLm1vZHVsZXMubm90aWZpY2F0aW9ucy5ub3RpZmljYXRpb25zLm1vZGVsLk5vdGlmaWNhdGlvbkNvbnRlbnQFhMvjE97pQgMADloADG1BdXRvRGlzbWlzc1oAF21TaG91bGRQbGF5RGVmYXVsdFNvdW5kWgAhbVNob3VsZFVzZURlZmF1bHRWaWJyYXRpb25QYXR0ZXJuWgAHbVN0aWNreUwAC21CYWRnZUNvdW50dAASTGphdmEvbGFuZy9OdW1iZXI7TAAFbUJvZHl0ABVMb3JnL2pzb24vSlNPTk9iamVjdDtMAAttQ2F0ZWdvcnlJZHQAEkxqYXZhL2xhbmcvU3RyaW5nO0wABm1Db2xvcnEAfgABTAAJbVByaW9yaXR5dABFTGV4cG8vbW9kdWxlcy9ub3RpZmljYXRpb25zL25vdGlmaWNhdGlvbnMvZW51bXMvTm90aWZpY2F0aW9uUHJpb3JpdHk7TAAGbVNvdW5kdAARTGFuZHJvaWQvbmV0L1VyaTtMAAltU3VidGl0bGVxAH4AA0wABW1UZXh0cQB+AANMAAZtVGl0bGVxAH4AA1sAEW1WaWJyYXRpb25QYXR0ZXJudAACW0p4cHQAClRlc3QgVGl0bGV0AAlUZXN0IFRleHR0AA1UZXN0IFN1YnRpdGxlc3IAEWphdmEubGFuZy5JbnRlZ2VyEuKgpPeBhzgCAAFJAAV2YWx1ZXhyABBqYXZhLmxhbmcuTnVtYmVyhqyVHQuU4IsCAAB4cAAAAAV3AQB0AAdVcmkoIzIpdyUAAAAABAAAAAAAAAAAAAAAAAAAAMgAAAAAAAAAyAAAAAAAAADIdAAPeyJrZXkiOiJ2YWx1ZSJ9c3EAfgALAAAAAXNxAH4ACwD/AAB3AQF0AA10ZXN0X2NhdGVnb3J5dwEAeA=="
    val serializedContent = java.util.Base64.getDecoder().decode(base64EncodedSerialized)
    val deserializedContent = ObjectInputStream(ByteArrayInputStream(serializedContent)).use {
      it.readObject() as NotificationContent
    }

    assertNotificationContentEquals(createSampleNotificationContent(), deserializedContent)
  }

  @Test
  fun testSerializationWithCustomValues() {
    val originalContent = createSampleNotificationContent()

    // Serialize and deserialize
    val deserializedContent = serializeAndDeserialize(originalContent)

    // Assert equality
    assertNotificationContentEquals(originalContent, deserializedContent)
  }

  private fun createSampleNotificationContent(): NotificationContent {
    return NotificationContent.Builder()
      .setTitle("Test Title")
      .setText("Test Text")
      .setSubtitle("Test Subtitle")
      .setBadgeCount(5)
      .setSound(Uri.parse("content://media/external/audio/media/123"))
      .setVibrationPattern(longArrayOf(0, 200, 200, 200))
      .setBody(JSONObject(mockData))
      .setPriority(NotificationPriority.HIGH)
      .setColor(0xFF0000)
      .setAutoDismiss(true)
      .setCategoryId("test_category")
      .setSticky(false)
      .build()
  }

  private fun serializeAndDeserialize(content: NotificationContent): NotificationContent {
    val byteArrayOutputStream = ByteArrayOutputStream()
    ObjectOutputStream(byteArrayOutputStream).use { it.writeObject(content) }
    return ObjectInputStream(ByteArrayInputStream(byteArrayOutputStream.toByteArray())).use {
      it.readObject() as NotificationContent
    }
  }

  private fun assertNotificationContentEquals(expected: NotificationContent, actual: NotificationContent) {
    assertEquals(expected.title, actual.title)
    assertEquals(expected.text, actual.text)
    assertEquals(expected.subText, actual.subText)
    assertEquals(expected.badgeCount, actual.badgeCount)
    assertEquals(expected.shouldPlayDefaultSound, actual.shouldPlayDefaultSound)
    assertEquals(expected.soundName, actual.soundName)
    assertEquals(expected.shouldUseDefaultVibrationPattern, actual.shouldUseDefaultVibrationPattern)
    assertArrayEquals(expected.vibrationPattern, actual.vibrationPattern)
    assertEquals(expected.body?.toString(), actual.body?.toString())
    assertEquals(expected.priority, actual.priority)
    assertEquals(expected.color, actual.color)
    assertEquals(expected.isAutoDismiss, actual.isAutoDismiss)
    assertEquals(expected.categoryId, actual.categoryId)
    assertEquals(expected.isSticky, actual.isSticky)
  }
}
