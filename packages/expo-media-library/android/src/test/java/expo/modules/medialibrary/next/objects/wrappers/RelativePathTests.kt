package expo.modules.medialibrary.next.objects.wrappers

import android.os.Environment
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class RelativePathTests {
  @Test
  fun `accepts a single directory segment`() {
    // then
    assertEquals("DCIM/", RelativePath("DCIM/").value)
  }

  @Test
  fun `accepts nested directory segments`() {
    // then
    assertEquals("Pictures/Holiday/", RelativePath("Pictures/Holiday/").value)
  }

  @Test
  fun `accepts spaces, digits and underscores inside a segment`() {
    // then
    assertEquals("Pictures/Trip 2026/", RelativePath("Pictures/Trip 2026/").value)
    assertEquals("Pictures/my_album/", RelativePath("Pictures/my_album/").value)
  }

  @Test
  fun `requires a trailing separator`() {
    // given MediaStore RELATIVE_PATH values always end with a separator
    // then
    assertThrows(IllegalArgumentException::class.java) { RelativePath("Pictures/Holiday") }
  }

  @Test
  fun `rejects a leading separator`() {
    // then
    assertThrows(IllegalArgumentException::class.java) { RelativePath("/Pictures/") }
  }

  @Test
  fun `rejects an empty path`() {
    // then
    assertThrows(IllegalArgumentException::class.java) { RelativePath("") }
    assertThrows(IllegalArgumentException::class.java) { RelativePath("/") }
  }

  @Test
  fun `rejects empty segments`() {
    // then
    assertThrows(IllegalArgumentException::class.java) { RelativePath("Pictures//Holiday/") }
  }

  @Test
  fun `rejects parent directory traversal`() {
    // given `toFilePath` concatenates the value onto the external storage root, so a segment that
    // walks upwards would escape the media directories entirely
    // then
    assertThrows(IllegalArgumentException::class.java) { RelativePath("../") }
    assertThrows(IllegalArgumentException::class.java) { RelativePath("Pictures/../../etc/") }
  }

  @Test
  fun `creates an asset path rooted at the media type directory`() {
    // when
    val imagePath = RelativePath.create(MimeType("image/png"))
    val audioPath = RelativePath.create(MimeType("audio/mpeg"))

    // then
    assertEquals("${Environment.DIRECTORY_DCIM}/", imagePath.value)
    assertEquals("${Environment.DIRECTORY_MUSIC}/", audioPath.value)
  }

  @Test
  fun `creates an album path underneath the album root directory`() {
    // when
    val imageAlbum = RelativePath.create(MimeType("image/png"), "Holiday")
    val audioAlbum = RelativePath.create(MimeType("audio/mpeg"), "Podcasts")

    // then
    assertEquals("${Environment.DIRECTORY_PICTURES}/Holiday/", imageAlbum.value)
    assertEquals("${Environment.DIRECTORY_MUSIC}/Podcasts/", audioAlbum.value)
  }

  @Test
  fun `builds an absolute file path underneath external storage`() {
    // given
    val externalRoot = Environment.getExternalStorageDirectory().absolutePath

    // when
    val filePath = RelativePath("Pictures/Holiday/").toFilePath()

    // then
    assertEquals("$externalRoot/Pictures/Holiday//", filePath)
  }
}
