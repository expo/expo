package expo.modules.medialibrary.next.objects.asset.factories

import android.net.Uri
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

/**
 * The content resolver gives up de-duplicating a file name after ~32 collisions, at which point
 * asset creation retries with a name built here. The name has to stay a valid MediaStore
 * `DISPLAY_NAME`: a bare file name, with the original extension preserved.
 */
@RunWith(RobolectricTestRunner::class)
internal class BuildUniqueDisplayNameTests {
  @Test
  fun `keeps the base name and the extension`() {
    // when
    val displayName = buildUniqueDisplayName(Uri.parse("file:///storage/DCIM/IMG_0001.jpg"))

    // then
    assertTrue(displayName, displayName.matches(Regex("""IMG_0001_[0-9a-f]{8}\.jpg""")))
  }

  @Test
  fun `omits the separator when the file has no extension`() {
    // when
    val displayName = buildUniqueDisplayName(Uri.parse("file:///storage/DCIM/screenshot"))

    // then
    assertTrue(displayName, displayName.matches(Regex("""screenshot_[0-9a-f]{8}""")))
  }

  @Test
  fun `keeps only the last extension of a multi-dot name`() {
    // when
    val displayName = buildUniqueDisplayName(Uri.parse("file:///storage/DCIM/my.holiday.photo.jpeg"))

    // then
    assertTrue(displayName, displayName.matches(Regex("""my\.holiday\.photo_[0-9a-f]{8}\.jpeg""")))
  }

  @Test
  fun `never produces a path separator`() {
    // given DISPLAY_NAME must be a bare file name, not a path
    // when
    val displayName = buildUniqueDisplayName(Uri.parse("file:///storage/DCIM/Album/IMG_1.jpg"))

    // then
    assertEquals(-1, displayName.indexOf('/'))
  }

  @Test
  fun `produces a different name on every call`() {
    // given
    val uri = Uri.parse("file:///storage/DCIM/IMG_0001.jpg")

    // then
    assertNotEquals(buildUniqueDisplayName(uri), buildUniqueDisplayName(uri))
  }
}
