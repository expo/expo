package expo.modules.medialibrary.next.objects.wrappers

import android.os.Environment
import android.provider.MediaStore
import expo.modules.medialibrary.next.extensions.resolver.EXTERNAL_CONTENT_URI
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class MimeTypeTests {
  @Test
  fun `splits a mime type into its type and subtype`() {
    // given
    val mimeType = MimeType("image/jpeg")

    // then
    assertEquals("image", mimeType.type)
    assertEquals("jpeg", mimeType.subType)
  }

  @Test
  fun `exposes null halves for an absent mime type`() {
    // given the content resolver could not determine the type
    val mimeType = MimeType(null)

    // then
    assertNull(mimeType.type)
    assertNull(mimeType.subType)
    assertFalse(mimeType.isImage())
    assertFalse(mimeType.isVideo())
    assertFalse(mimeType.isAudio())
  }

  @Test
  fun `classifies the top-level type`() {
    // then
    assertTrue(MimeType("image/png").isImage())
    assertTrue(MimeType("video/mp4").isVideo())
    assertTrue(MimeType("audio/mpeg").isAudio())
    assertFalse(MimeType("video/mp4").isImage())
  }

  @Test
  fun `routes visual media to DCIM and audio to Music when creating an asset`() {
    // then
    assertEquals(Environment.DIRECTORY_DCIM, MimeType("image/png").assetRootDirectory())
    assertEquals(Environment.DIRECTORY_DCIM, MimeType("video/mp4").assetRootDirectory())
    assertEquals(Environment.DIRECTORY_MUSIC, MimeType("audio/mpeg").assetRootDirectory())
    assertEquals(Environment.DIRECTORY_DCIM, MimeType(null).assetRootDirectory())
  }

  @Test
  fun `routes visual media to Pictures and audio to Music when creating an album`() {
    // then
    assertEquals(Environment.DIRECTORY_PICTURES, MimeType("image/png").albumRootDirectory())
    assertEquals(Environment.DIRECTORY_PICTURES, MimeType("video/mp4").albumRootDirectory())
    assertEquals(Environment.DIRECTORY_MUSIC, MimeType("audio/mpeg").albumRootDirectory())
    assertEquals(Environment.DIRECTORY_PICTURES, MimeType(null).albumRootDirectory())
  }

  @Test
  fun `maps to the matching MediaStore collection uri`() {
    // then
    assertEquals(
      MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
      MimeType("image/png").mediaCollectionUri()
    )
    assertEquals(
      MediaStore.Video.Media.EXTERNAL_CONTENT_URI,
      MimeType("video/mp4").mediaCollectionUri()
    )
    assertEquals(
      MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
      MimeType("audio/mpeg").mediaCollectionUri()
    )
    assertEquals(EXTERNAL_CONTENT_URI, MimeType(null).mediaCollectionUri())
  }

  @Test
  fun `accepts a subtype containing a dash`() {
    // given AAC audio recorded on Android reports this type
    // then
    assertEquals("audio/mp4a-latm", MimeType("audio/mp4a-latm").value)
    assertEquals("mp4a-latm", MimeType("audio/mp4a-latm").subType)
  }

  @Test
  fun `rejects strings that are not a type-subtype pair`() {
    // then
    assertThrows(IllegalArgumentException::class.java) { MimeType("image") }
    assertThrows(IllegalArgumentException::class.java) { MimeType("") }
    assertThrows(IllegalArgumentException::class.java) { MimeType("image/png/extra") }
    assertThrows(IllegalArgumentException::class.java) { MimeType("image /png") }
  }
}
