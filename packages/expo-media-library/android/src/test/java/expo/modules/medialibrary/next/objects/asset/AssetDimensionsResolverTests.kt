package expo.modules.medialibrary.next.objects.asset

import expo.modules.medialibrary.next.objects.asset.domain.AssetMediaStoreItem
import expo.modules.medialibrary.next.objects.asset.domain.MediaStoreAudio
import expo.modules.medialibrary.next.objects.asset.domain.MediaStoreImage
import expo.modules.medialibrary.next.objects.asset.domain.MediaStoreVideo
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

/**
 * Decoding a file just to read its bounds is expensive, so the resolver must only fall back to
 * `BitmapFactory` when MediaStore has no usable dimensions, and only for images.
 */
@RunWith(RobolectricTestRunner::class)
internal class AssetDimensionsResolverTests {
  private val resolver = AssetDimensionsResolver()

  private fun image(width: Int?, height: Int?, data: String? = "/storage/DCIM/a.jpg") =
    MediaStoreImage(
      id = 1L,
      displayName = "a.jpg",
      dateTaken = 0L,
      dateModified = 0L,
      width = width,
      height = height,
      orientation = 0,
      data = data,
      isFavorite = 0
    )

  @Test
  fun `leaves an image untouched when MediaStore already has both dimensions`() = runTest {
    // given
    val item = AssetMediaStoreItem.Image(image(width = 4000, height = 3000))

    // when
    val resolved = resolver.resolveDimensions(item)

    // then
    assertEquals(4000, (resolved as AssetMediaStoreItem.Image).asset.width)
    assertEquals(3000, resolved.asset.height)
  }

  @Test
  fun `leaves an image untouched when there is no file path to decode`() = runTest {
    // given a MediaStore row with neither dimensions nor a DATA path
    val item = AssetMediaStoreItem.Image(image(width = null, height = null, data = null))

    // when
    val resolved = resolver.resolveDimensions(item)

    // then the wrapper is rebuilt for images, so compare by value rather than by identity
    assertEquals(item, resolved)
  }

  @Test
  fun `never decodes a video`() = runTest {
    // given MediaStore always populates video dimensions, and decoding a video with
    // BitmapFactory would fail anyway
    val item = AssetMediaStoreItem.Video(
      MediaStoreVideo(
        id = 2L,
        displayName = "a.mp4",
        dateTaken = 0L,
        dateModified = 0L,
        width = null,
        height = null,
        orientation = 0,
        duration = 1000L,
        data = "/storage/DCIM/a.mp4",
        isFavorite = 0
      )
    )

    // when
    val resolved = resolver.resolveDimensions(item)

    // then
    assertSame(item, resolved)
  }

  @Test
  fun `never decodes an audio file`() = runTest {
    // given
    val item = AssetMediaStoreItem.Audio(
      MediaStoreAudio(
        id = 3L,
        displayName = "a.mp3",
        dateTaken = 0L,
        dateModified = 0L,
        duration = 1000L,
        data = "/storage/Music/a.mp3",
        isFavorite = 0
      )
    )

    // when
    val resolved = resolver.resolveDimensions(item)

    // then
    assertSame(item, resolved)
  }
}
