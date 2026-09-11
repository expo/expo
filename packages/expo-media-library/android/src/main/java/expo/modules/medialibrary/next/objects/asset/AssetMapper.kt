package expo.modules.medialibrary.next.objects.asset

import android.net.Uri
import android.provider.MediaStore
import androidx.core.net.toUri
import expo.modules.medialibrary.next.exceptions.AssetPropertyNotFoundException
import expo.modules.medialibrary.next.extensions.resolver.extractAssetContentUri
import expo.modules.medialibrary.next.objects.asset.domain.AssetMediaStoreItem
import expo.modules.medialibrary.next.objects.asset.domain.MediaStoreAudio
import expo.modules.medialibrary.next.objects.asset.domain.MediaStoreFile
import expo.modules.medialibrary.next.objects.asset.domain.MediaStoreImage
import expo.modules.medialibrary.next.objects.asset.domain.MediaStoreVideo
import expo.modules.medialibrary.next.objects.wrappers.MediaType
import expo.modules.medialibrary.next.records.AssetInfo
import expo.modules.medialibrary.next.records.AssetMetadata
import expo.modules.medialibrary.next.records.Shape
import java.io.File
import kotlin.math.abs
import kotlin.time.DurationUnit
import kotlin.time.toDuration

class AssetMapper {
  fun toDto(mediaStoreItem: AssetMediaStoreItem): AssetInfo =
    when (mediaStoreItem) {
      is AssetMediaStoreItem.Image -> toDto(mediaStoreItem.asset)
      is AssetMediaStoreItem.Video -> toDto(mediaStoreItem.asset)
      is AssetMediaStoreItem.Audio -> toDto(mediaStoreItem.asset)
    }

  private fun toDto(imageAsset: MediaStoreImage): AssetInfo {
    val contentUri = extractAssetContentUri(
      imageAsset.id,
      MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE
    )

    val (width, height) = mapDisplaySize(
      mediaStoreWidth = imageAsset.width,
      mediaStoreHeight = imageAsset.height,
      mediaStoreOrientation = imageAsset.orientation
    )

    return AssetInfo(
      id = contentUri,
      uri = mapUri(imageAsset.data)
        ?: throw AssetPropertyNotFoundException("Uri"),
      mediaType = MediaType.IMAGE,
      width = width,
      height = height,
      creationTime = mapCreationTime(imageAsset.dateTaken),
      modificationTime = mapModificationTime(imageAsset.dateModified),
      duration = null,
      filename = imageAsset.displayName
        ?: throw AssetPropertyNotFoundException("Filename"),
      isFavorite = mapIsFavorite(imageAsset.isFavorite)
    )
  }

  private fun toDto(videoAsset: MediaStoreVideo): AssetInfo {
    val contentUri = extractAssetContentUri(
      videoAsset.id,
      MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO
    )

    val (width, height) = mapDisplaySize(
      mediaStoreWidth = videoAsset.width,
      mediaStoreHeight = videoAsset.height,
      mediaStoreOrientation = videoAsset.orientation
    )

    return AssetInfo(
      id = contentUri,
      uri = mapUri(videoAsset.data)
        ?: throw AssetPropertyNotFoundException("Uri"),
      mediaType = MediaType.VIDEO,
      width = width,
      height = height,
      creationTime = mapCreationTime(videoAsset.dateTaken),
      modificationTime = mapModificationTime(videoAsset.dateModified),
      duration = mapDuration(videoAsset.duration),
      filename = videoAsset.displayName
        ?: throw AssetPropertyNotFoundException("Filename"),
      isFavorite = mapIsFavorite(videoAsset.isFavorite)
    )
  }

  private fun toDto(audioAsset: MediaStoreAudio): AssetInfo {
    val contentUri = extractAssetContentUri(
      audioAsset.id,
      MediaStore.Files.FileColumns.MEDIA_TYPE_AUDIO
    )

    return AssetInfo(
      id = contentUri,
      uri = mapUri(audioAsset.data)
        ?: throw AssetPropertyNotFoundException("Uri"),
      mediaType = MediaType.AUDIO,
      width = 0,
      height = 0,
      creationTime = mapCreationTime(audioAsset.dateTaken),
      modificationTime = mapModificationTime(audioAsset.dateModified),
      duration = mapDuration(audioAsset.duration),
      filename = audioAsset.displayName
        ?: throw AssetPropertyNotFoundException("Filename"),
      isFavorite = mapIsFavorite(audioAsset.isFavorite)
    )
  }

  fun toMetadata(fileAsset: MediaStoreFile): AssetMetadata {
    val shape = mapShape(fileAsset.width, fileAsset.height, fileAsset.orientation)
    return AssetMetadata(
      id = extractAssetContentUri(fileAsset.id, fileAsset.mediaType),
      mediaType = fileAsset.mediaType?.let { MediaType.fromMediaStoreValue(it) }
        ?: MediaType.UNKNOWN,
      width = shape?.width ?: fileAsset.width,
      height = shape?.height ?: fileAsset.height,
      creationTime = mapCreationTime(fileAsset.dateTaken),
      modificationTime = mapModificationTime(fileAsset.dateModified),
      duration = mapDuration(fileAsset.duration),
      filename = fileAsset.displayName,
      isFavorite = mapIsFavorite(fileAsset.isFavorite)
    )
  }

  fun mapShape(mediaStoreItem: AssetMediaStoreItem): Shape? =
    when (mediaStoreItem) {
      is AssetMediaStoreItem.Image -> with(mediaStoreItem.asset) {
        mapShape(width, height, orientation)
      }
      is AssetMediaStoreItem.Video -> with(mediaStoreItem.asset) {
        mapShape(width, height, orientation)
      }
      is AssetMediaStoreItem.Audio -> null
    }

  private fun mapShape(
    mediaStoreWidth: Int?,
    mediaStoreHeight: Int?,
    mediaStoreOrientation: Int?
  ): Shape? {
    val width = mediaStoreWidth?.takeIf { it > 0 } ?: return null
    val height = mediaStoreHeight?.takeIf { it > 0 } ?: return null
    return orientToDisplay(width, height, mediaStoreOrientation)
  }

  private fun mapDisplaySize(
    mediaStoreWidth: Int?,
    mediaStoreHeight: Int?,
    mediaStoreOrientation: Int?
  ): Shape {
    val width = mediaStoreWidth?.takeIf { it > 0 }
      ?: throw AssetPropertyNotFoundException("Width")
    val height = mediaStoreHeight?.takeIf { it > 0 }
      ?: throw AssetPropertyNotFoundException("Height")
    return orientToDisplay(width, height, mediaStoreOrientation)
  }

  private fun orientToDisplay(width: Int, height: Int, mediaStoreOrientation: Int?): Shape =
    if (isQuarterTurn(mediaStoreOrientation)) {
      Shape(width = height, height = width)
    } else {
      Shape(width = width, height = height)
    }

  // abs is a defensive programming; MediaStore orientation should always be one of 0/90/180/270,
  // but the column doesn't ensure it
  private fun isQuarterTurn(mediaStoreOrientation: Int?) =
    abs(mediaStoreOrientation ?: 0) % 180 == 90

  fun mapCreationTime(mediaStoreDateTaken: Long?): Long? =
    mediaStoreDateTaken.takeIf { it != 0L }

  fun mapDuration(mediaStoreDuration: Long?): Long? =
    mediaStoreDuration.takeIf { it != 0L }

  fun mapModificationTime(mediaStoreDateModified: Long?): Long? =
    mediaStoreDateModified
      ?.takeIf { it != 0L }
      ?.toDuration(DurationUnit.SECONDS)
      ?.inWholeMilliseconds

  fun mapUri(mediaStoreData: String?): Uri? =
    mediaStoreData?.let { File(it).toUri() }

  fun mapIsFavorite(mediaStoreIsFavorite: Int?): Boolean =
    mediaStoreIsFavorite == 1
}
