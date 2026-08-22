package expo.modules.medialibrary.next.extensions.resolver

import android.os.Build
import android.provider.MediaStore
import expo.modules.medialibrary.next.objects.wrappers.MediaType
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * `Asset.id` is the content uri produced here, so its shape is public API: it is what JS stores
 * and later passes back to `new Asset(id)`. It also has to round-trip through
 * [MediaType.fromContentUri], which reads the collection path segment.
 */
@RunWith(RobolectricTestRunner::class)
internal class ExtractAssetContentUriTests {
  @Test
  @Config(sdk = [Build.VERSION_CODES.UPSIDE_DOWN_CAKE])
  fun `builds a per-collection uri`() {
    // then
    assertEquals(
      "${MediaStore.Images.Media.EXTERNAL_CONTENT_URI}/42",
      extractAssetContentUri(42L, MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE).toString()
    )
    assertEquals(
      "${MediaStore.Video.Media.EXTERNAL_CONTENT_URI}/42",
      extractAssetContentUri(42L, MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO).toString()
    )
    assertEquals(
      "${MediaStore.Audio.Media.EXTERNAL_CONTENT_URI}/42",
      extractAssetContentUri(42L, MediaStore.Files.FileColumns.MEDIA_TYPE_AUDIO).toString()
    )
  }

  @Test
  @Config(sdk = [Build.VERSION_CODES.UPSIDE_DOWN_CAKE])
  fun `falls back to the files collection for non-media rows`() {
    // given MediaStore.Files also indexes documents and downloads
    // then
    assertEquals(
      "$EXTERNAL_CONTENT_URI/42",
      extractAssetContentUri(42L, MediaStore.Files.FileColumns.MEDIA_TYPE_NONE).toString()
    )
    assertEquals("$EXTERNAL_CONTENT_URI/42", extractAssetContentUri(42L, null).toString())
  }

  @Test
  @Config(sdk = [Build.VERSION_CODES.UPSIDE_DOWN_CAKE])
  fun `produces uris that resolve back to the same media type`() {
    // then
    assertEquals(
      MediaType.IMAGE,
      MediaType.fromContentUri(
        extractAssetContentUri(1L, MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE)
      )
    )
    assertEquals(
      MediaType.VIDEO,
      MediaType.fromContentUri(
        extractAssetContentUri(1L, MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO)
      )
    )
    assertEquals(
      MediaType.AUDIO,
      MediaType.fromContentUri(
        extractAssetContentUri(1L, MediaStore.Files.FileColumns.MEDIA_TYPE_AUDIO)
      )
    )
  }

  @Test
  @Config(sdk = [Build.VERSION_CODES.Q])
  fun `pins the uri to the primary external volume on Android 10`() {
    // given on exactly API 29 the volume-less collection uris are not writable, so the
    // implementation switches to the explicit `external_primary` volume
    // then
    assertEquals(
      "${MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)}/42",
      extractAssetContentUri(42L, MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE).toString()
    )
    assertEquals(
      "${MediaStore.Files.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)}/42",
      extractAssetContentUri(42L, null).toString()
    )
  }
}
