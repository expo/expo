package expo.modules.medialibrary.next.objects.wrappers

import android.net.Uri
import android.provider.MediaStore
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class MediaTypeTests {
  @Test
  fun `parses api names case-insensitively`() {
    // then
    assertEquals(MediaType.IMAGE, MediaType.fromString("image"))
    assertEquals(MediaType.IMAGE, MediaType.fromString("IMAGE"))
    assertEquals(MediaType.VIDEO, MediaType.fromString("Video"))
    assertEquals(MediaType.AUDIO, MediaType.fromString("audio"))
  }

  @Test
  fun `falls back to unknown for unrecognised api names`() {
    // then
    assertEquals(MediaType.UNKNOWN, MediaType.fromString("unknown"))
    assertEquals(MediaType.UNKNOWN, MediaType.fromString("photo"))
    assertEquals(MediaType.UNKNOWN, MediaType.fromString(""))
  }

  @Test
  fun `round-trips through MediaStore column values`() {
    // then
    for (mediaType in MediaType.entries) {
      assertEquals(mediaType, MediaType.fromMediaStoreValue(mediaType.toMediaStoreValue()))
    }
  }

  @Test
  fun `maps to the MediaStore file column constants`() {
    // then
    assertEquals(MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE, MediaType.IMAGE.toMediaStoreValue())
    assertEquals(MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO, MediaType.VIDEO.toMediaStoreValue())
    assertEquals(MediaStore.Files.FileColumns.MEDIA_TYPE_AUDIO, MediaType.AUDIO.toMediaStoreValue())
    assertEquals(MediaStore.Files.FileColumns.MEDIA_TYPE_NONE, MediaType.UNKNOWN.toMediaStoreValue())
  }

  @Test
  fun `falls back to unknown for unmapped MediaStore column values`() {
    // given MEDIA_TYPE_PLAYLIST and MEDIA_TYPE_SUBTITLE have no equivalent in the new API
    // then
    assertEquals(
      MediaType.UNKNOWN,
      MediaType.fromMediaStoreValue(MediaStore.Files.FileColumns.MEDIA_TYPE_SUBTITLE)
    )
  }

  @Test
  fun `derives the media type from a content uri collection segment`() {
    // then
    assertEquals(
      MediaType.IMAGE,
      MediaType.fromContentUri(Uri.parse("content://media/external/images/media/42"))
    )
    assertEquals(
      MediaType.VIDEO,
      MediaType.fromContentUri(Uri.parse("content://media/external/video/media/42"))
    )
    assertEquals(
      MediaType.AUDIO,
      MediaType.fromContentUri(Uri.parse("content://media/external/audio/media/42"))
    )
  }

  @Test
  fun `treats the generic files collection as unknown`() {
    // given `Query` builds this uri for rows whose MEDIA_TYPE is NONE
    // then
    assertEquals(
      MediaType.UNKNOWN,
      MediaType.fromContentUri(Uri.parse("content://media/external/file/42"))
    )
  }
}
