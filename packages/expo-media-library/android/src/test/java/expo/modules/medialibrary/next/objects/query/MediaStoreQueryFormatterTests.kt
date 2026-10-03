package expo.modules.medialibrary.next.objects.query

import expo.modules.medialibrary.next.objects.wrappers.MediaType
import expo.modules.medialibrary.next.records.AssetField
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

/**
 * `Query` values cross the bridge in the same units the `Asset` getters return: timestamps and
 * durations in milliseconds. MediaStore is not consistent — `DATE_TAKEN` and `DURATION` are stored
 * in milliseconds, `DATE_MODIFIED` in seconds — so the formatter has to convert exactly one field.
 * These tests pin that asymmetry, because getting it wrong silently returns the wrong rows instead
 * of raising an error.
 */
@RunWith(RobolectricTestRunner::class)
internal class MediaStoreQueryFormatterTests {
  @Test
  fun `converts modification time from milliseconds to seconds`() {
    // given DATE_MODIFIED is stored in seconds
    val millis = 1_767_225_600_000L

    // when
    val formatted = MediaStoreQueryFormatter.parse(AssetField.MODIFICATION_TIME, millis)

    // then
    assertEquals("1767225600", formatted)
  }

  @Test
  fun `truncates sub-second precision when converting modification time`() {
    // when
    val formatted = MediaStoreQueryFormatter.parse(AssetField.MODIFICATION_TIME, 1_999L)

    // then
    assertEquals("1", formatted)
  }

  @Test
  fun `keeps creation time in milliseconds`() {
    // given DATE_TAKEN is already stored in milliseconds
    val millis = 1_767_225_600_000L

    // when
    val formatted = MediaStoreQueryFormatter.parse(AssetField.CREATION_TIME, millis)

    // then
    assertEquals("1767225600000", formatted)
  }

  @Test
  fun `keeps duration in milliseconds`() {
    // when
    val formatted = MediaStoreQueryFormatter.parse(AssetField.DURATION, 4_200L)

    // then
    assertEquals("4200", formatted)
  }

  @Test
  fun `passes dimensions through unchanged`() {
    // then
    assertEquals("1080", MediaStoreQueryFormatter.parse(AssetField.WIDTH, 1_080L))
    assertEquals("1920", MediaStoreQueryFormatter.parse(AssetField.HEIGHT, 1_920L))
  }

  @Test
  fun `formats media types as their MediaStore column values`() {
    // then
    assertEquals("1", MediaStoreQueryFormatter.parse(MediaType.IMAGE))
    assertEquals("2", MediaStoreQueryFormatter.parse(MediaType.AUDIO))
    assertEquals("3", MediaStoreQueryFormatter.parse(MediaType.VIDEO))
    assertEquals("0", MediaStoreQueryFormatter.parse(MediaType.UNKNOWN))
  }
}
