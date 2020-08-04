package expo.modules.medialibrary

import android.provider.MediaStore.Files.FileColumns.MEDIA_TYPE_AUDIO
import android.provider.MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE
import android.provider.MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO

/*
 Column order:
 ID, DisplayName, uri, MediaType, Width, Height, DateTaken, DateModified, Orientation, Duration, BucketId
 */
internal data class MockAsset(
  val id: Long,
  val name: String?,
  val path: String?,
  val mediaType: Int?,
  val width: Int?,
  val height: Int?,
  val createdDate: Long?,
  val modifiedDate: Long?,
  val orientation: Int?,
  val duration: Int?,
  val albumId: String?
) {
  fun toColumnArray() = arrayOf(
    id, name, path, mediaType,
    width, height,
    createdDate, modifiedDate,
    orientation, duration,
    albumId
  )
}

internal object MockData {
  val mockImage = MockAsset(
    1L,
    "img1.jpg",
    "images/img1.jpg",
    MEDIA_TYPE_IMAGE,
    100, 200,
    12345678,
    23456789,
    0,
    null,
    "album12"
  )

  val mockVideo = MockAsset(
    2L,
    "vid2.mp4",
    "videos/vid2.mp4",
    MEDIA_TYPE_VIDEO,
    200, 300,
    12345678,
    23456789,
    0,
    3000,
    "album23"
  )

  val mockAudio = MockAsset(
    3L,
    "song3.mp3",
    "audio/song3.mp3",
    MEDIA_TYPE_AUDIO,
    0, 0,
    12345678,
    23456789,
    null,
    10000,
    null
  )
}
