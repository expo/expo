package expo.modules.medialibrary.next.objects.asset

import android.provider.MediaStore
import expo.modules.medialibrary.next.exceptions.AssetPropertyNotFoundException
import expo.modules.medialibrary.next.objects.asset.domain.AssetMediaStoreItem
import expo.modules.medialibrary.next.objects.asset.domain.MediaStoreAudio
import expo.modules.medialibrary.next.objects.asset.domain.MediaStoreFile
import expo.modules.medialibrary.next.objects.asset.domain.MediaStoreImage
import expo.modules.medialibrary.next.objects.asset.domain.MediaStoreVideo
import expo.modules.medialibrary.next.objects.wrappers.MediaType
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
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

  private fun mediaStoreAudio() = MediaStoreAudio(
    id = 4L,
    displayName = "song.mp3",
    dateTaken = 0L,
    dateModified = 0L,
    duration = 30_000L,
    data = "/storage/emulated/0/Music/song.mp3",
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

  @Test
  fun `toDto keeps image dimensions when orientation is a half turn`() {
    // given a 180 degree rotation does not change the display aspect ratio
    // act
    val info = mapper.toDto(AssetMediaStoreItem.Image(mediaStoreImage(orientation = 180)))

    // assert
    assertEquals(4000, info.width)
    assertEquals(3000, info.height)
  }

  @Test
  fun `toDto swaps image dimensions when orientation is negative`() {
    // given MediaStore should only ever store 0/90/180/270, but the column does not enforce it
    // act
    val info = mapper.toDto(AssetMediaStoreItem.Image(mediaStoreImage(orientation = -90)))

    // assert
    assertEquals(3000, info.width)
    assertEquals(4000, info.height)
  }

  @Test
  fun `mapCreationTime keeps DATE_TAKEN in milliseconds`() {
    // given MediaStore stores DATE_TAKEN in milliseconds since the epoch
    // act & assert
    assertEquals(1_767_225_600_000L, mapper.mapCreationTime(1_767_225_600_000L))
  }

  @Test
  fun `mapCreationTime treats zero and null as unavailable`() {
    // given MediaStore leaves DATE_TAKEN at 0 for assets that never had one, such as downloads
    // act & assert
    assertNull(mapper.mapCreationTime(0L))
    assertNull(mapper.mapCreationTime(null))
  }

  @Test
  fun `mapModificationTime converts DATE_MODIFIED from seconds to milliseconds`() {
    // given MediaStore stores DATE_MODIFIED in seconds, unlike DATE_TAKEN
    // act & assert
    assertEquals(1_767_225_600_000L, mapper.mapModificationTime(1_767_225_600L))
  }

  @Test
  fun `mapModificationTime treats zero and null as unavailable`() {
    // act & assert
    assertNull(mapper.mapModificationTime(0L))
    assertNull(mapper.mapModificationTime(null))
  }

  @Test
  fun `mapDuration keeps DURATION in milliseconds`() {
    // given MediaStore stores DURATION in milliseconds
    // act & assert
    assertEquals(4_200L, mapper.mapDuration(4_200L))
  }

  @Test
  fun `mapDuration treats zero and null as unavailable`() {
    // act & assert
    assertNull(mapper.mapDuration(0L))
    assertNull(mapper.mapDuration(null))
  }

  @Test
  fun `mapIsFavorite reads the IS_FAVORITE flag`() {
    // given the column is an integer flag and is absent below Android 10
    // act & assert
    assertEquals(true, mapper.mapIsFavorite(1))
    assertEquals(false, mapper.mapIsFavorite(0))
    assertEquals(false, mapper.mapIsFavorite(null))
  }

  @Test
  fun `mapUri builds a file uri from the DATA column`() {
    // act
    val uri = mapper.mapUri("/storage/emulated/0/DCIM/portrait.jpg")

    // assert
    assertEquals("file:///storage/emulated/0/DCIM/portrait.jpg", uri.toString())
  }

  @Test
  fun `mapUri returns null when the DATA column is absent`() {
    // act & assert
    assertNull(mapper.mapUri(null))
  }

  @Test
  fun `toDto reports audio assets as zero-sized with a duration`() {
    // given audio has no dimensions, so AssetInfo reports 0 rather than failing
    // act
    val info = mapper.toDto(AssetMediaStoreItem.Audio(mediaStoreAudio()))

    // assert
    assertEquals(0, info.width)
    assertEquals(0, info.height)
    assertEquals(30_000L, info.duration!!)
    assertEquals(MediaType.AUDIO, info.mediaType)
  }

  @Test
  fun `mapShape returns null for audio assets`() {
    // act & assert
    assertNull(mapper.mapShape(AssetMediaStoreItem.Audio(mediaStoreAudio())))
  }

  @Test
  fun `mapShape returns null when a dimension is missing`() {
    // act & assert
    assertNull(
      mapper.mapShape(
        AssetMediaStoreItem.Image(mediaStoreImage(orientation = 0).copy(width = null))
      )
    )
    assertNull(
      mapper.mapShape(
        AssetMediaStoreItem.Image(mediaStoreImage(orientation = 0).copy(height = 0))
      )
    )
  }

  @Test
  fun `toDto fails with a coded exception when the filename is missing`() {
    // given MediaStore rows can be incomplete while a file is still being written
    // act & assert
    assertThrows(AssetPropertyNotFoundException::class.java) {
      mapper.toDto(
        AssetMediaStoreItem.Image(mediaStoreImage(orientation = 0).copy(displayName = null))
      )
    }
  }

  @Test
  fun `toDto fails with a coded exception when a dimension is missing`() {
    // act & assert
    assertThrows(AssetPropertyNotFoundException::class.java) {
      mapper.toDto(AssetMediaStoreItem.Image(mediaStoreImage(orientation = 0).copy(width = null)))
    }
    assertThrows(AssetPropertyNotFoundException::class.java) {
      mapper.toDto(AssetMediaStoreItem.Image(mediaStoreImage(orientation = 0).copy(height = 0)))
    }
  }

  @Test
  fun `toDto fails with a coded exception when the DATA path is missing`() {
    // act & assert
    assertThrows(AssetPropertyNotFoundException::class.java) {
      mapper.toDto(AssetMediaStoreItem.Image(mediaStoreImage(orientation = 0).copy(data = null)))
    }
  }
}
