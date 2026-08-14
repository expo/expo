package expo.modules.medialibrary.next.objects.asset

import android.provider.MediaStore
import expo.modules.medialibrary.next.objects.asset.domain.AssetMediaStoreItem
import expo.modules.medialibrary.next.objects.asset.domain.MediaStoreFile
import expo.modules.medialibrary.next.objects.asset.domain.MediaStoreImage
import expo.modules.medialibrary.next.objects.asset.domain.MediaStoreVideo
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class AssetMapperTests {
  private val mapper = AssetMapper()

  private fun mediaStoreImage(orientation: Int?) = MediaStoreImage(
    id = 1L,
    displayName = "portrait.jpg",
    dateTaken = 0L,
    dateModified = 0L,
    width = 4000,
    height = 3000,
    orientation = orientation,
    data = "/storage/emulated/0/DCIM/portrait.jpg",
    isFavorite = 0
  )

  private fun mediaStoreVideo(orientation: Int?) = MediaStoreVideo(
    id = 2L,
    displayName = "portrait.mp4",
    dateTaken = 0L,
    dateModified = 0L,
    width = 1920,
    height = 1080,
    orientation = orientation,
    duration = 1000L,
    data = "/storage/emulated/0/DCIM/portrait.mp4",
    isFavorite = 0
  )

  private fun mediaStoreFile(orientation: Int?, width: Int?, height: Int?) = MediaStoreFile(
    id = 3L,
    displayName = "portrait.jpg",
    dateTaken = 0L,
    dateModified = 0L,
    width = width,
    height = height,
    orientation = orientation,
    duration = null,
    mediaType = MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE,
    isFavorite = 0
  )

  @Test
  fun `toDto swaps image dimensions when orientation is 90`() = runTest {
    // act
    val info = mapper.toDto(AssetMediaStoreItem.Image(mediaStoreImage(orientation = 90)))

    // assert
    assertEquals(3000, info.width)
    assertEquals(4000, info.height)
  }

  @Test
  fun `toDto keeps image dimensions when orientation is 0`() = runTest {
    // act
    val info = mapper.toDto(AssetMediaStoreItem.Image(mediaStoreImage(orientation = 0)))

    // assert
    assertEquals(4000, info.width)
    assertEquals(3000, info.height)
  }

  @Test
  fun `toDto keeps image dimensions when orientation is missing`() = runTest {
    // act
    val info = mapper.toDto(AssetMediaStoreItem.Image(mediaStoreImage(orientation = null)))

    // assert
    assertEquals(4000, info.width)
    assertEquals(3000, info.height)
  }

  @Test
  fun `toDto swaps video dimensions when orientation is 270`() = runTest {
    // act
    val info = mapper.toDto(AssetMediaStoreItem.Video(mediaStoreVideo(orientation = 270)))

    // assert
    assertEquals(1080, info.width)
    assertEquals(1920, info.height)
  }

  @Test
  fun `toDto keeps video dimensions when orientation is missing`() = runTest {
    // act
    val info = mapper.toDto(AssetMediaStoreItem.Video(mediaStoreVideo(orientation = null)))

    // assert
    assertEquals(1920, info.width)
    assertEquals(1080, info.height)
  }

  @Test
  fun `toMetadata swaps dimensions when orientation is 90`() {
    // act
    val metadata = mapper.toMetadata(mediaStoreFile(orientation = 90, width = 4000, height = 3000))

    // assert
    assertEquals(3000, metadata.width)
    assertEquals(4000, metadata.height)
  }

  @Test
  fun `toMetadata keeps missing dimensions when orientation is 90`() {
    // act
    val metadata = mapper.toMetadata(mediaStoreFile(orientation = 90, width = null, height = null))

    // assert
    assertNull(metadata.width)
    assertNull(metadata.height)
  }
}
