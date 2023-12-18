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

/*
  Projection column order:
  Bucket ID, Bucket Display Name
 */
internal data class MockAlbum(
  val id: String,
  val name: String
) {
  fun toColumnArray() = arrayOf(id, name)
}

internal object MockData {
  const val MOCK_ALBUM_ID = "album12"

  val mockImage = MockAsset(
    id = 1L,
    name = "img1.jpg",
    path = "images/img1.jpg",
    mediaType = MEDIA_TYPE_IMAGE,
    width = 100,
    height = 200,
    createdDate = 12345678,
    modifiedDate = 23456789,
    orientation = 0,
    duration = null,
    albumId = MOCK_ALBUM_ID
  )

  val mockVideo = MockAsset(
    id = 2L,
    name = "vid2.mp4",
    path = "videos/vid2.mp4",
    mediaType = MEDIA_TYPE_VIDEO,
    width = 200,
    height = 300,
    createdDate = 12345678,
    modifiedDate = 23456789,
    orientation = 0,
    duration = 3000,
    albumId = MOCK_ALBUM_ID
  )

  val mockAudio = MockAsset(
    id = 3L,
    name = "song3.mp3",
    path = "audio/song3.mp3",
    mediaType = MEDIA_TYPE_AUDIO,
    width = 0,
    height = 0,
    createdDate = 12345678,
    modifiedDate = 23456789,
    orientation = null,
    duration = 10000,
    albumId = null
  )

  val mockAlbum = MockAlbum(
    id = MOCK_ALBUM_ID,
    name = "TestAlbum"
  )
}
