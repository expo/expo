package expo.modules.medialibrary.next.objects.asset

import android.content.ContentResolver
import android.graphics.BitmapFactory
import android.net.Uri
import android.provider.MediaStore
import androidx.core.net.toUri
import expo.modules.medialibrary.next.exceptions.AssetPropertyNotFoundException
import expo.modules.medialibrary.next.extensions.resolver.extractAssetContentUri
import expo.modules.medialibrary.next.extensions.resolver.queryAssetData
import expo.modules.medialibrary.next.objects.asset.domain.AssetMediaStoreItem
import expo.modules.medialibrary.next.objects.asset.domain.MediaStoreAudioAsset
import expo.modules.medialibrary.next.objects.asset.domain.MediaStoreImageAsset
import expo.modules.medialibrary.next.objects.asset.domain.MediaStoreVideoAsset
import expo.modules.medialibrary.next.objects.wrappers.MediaType
import expo.modules.medialibrary.next.records.AssetInfo
import expo.modules.medialibrary.next.records.AssetMetadata
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import kotlin.time.DurationUnit
import kotlin.time.toDuration

class AssetMapper(private val contentResolver: ContentResolver) {
  suspend fun toDto(mediaStoreItem: AssetMediaStoreItem): AssetInfo =
    when (mediaStoreItem) {
      is AssetMediaStoreItem.Image -> toDto(mediaStoreItem.asset)
      is AssetMediaStoreItem.Video -> toDto(mediaStoreItem.asset)
      is AssetMediaStoreItem.Audio -> toDto(mediaStoreItem.asset)
    }

  private suspend fun toDto(imageAsset: MediaStoreImageAsset): AssetInfo {
    val contentUri = extractAssetContentUri(
      imageAsset.id,
      MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE
    )

    return AssetInfo(
      id = contentUri,
      uri = mapUri(imageAsset.data) ?: contentUri,
      mediaType = MediaType.IMAGE,
      width = mapWidth(imageAsset.width, contentUri) ?: 0,
      height = mapHeight(imageAsset.height, contentUri) ?: 0,
      creationTime = mapCreationTime(imageAsset.dateTaken),
      modificationTime = mapModificationTime(imageAsset.dateModified),
      duration = null,
      filename = imageAsset.displayName ?: throw AssetPropertyNotFoundException("Filename"),
      isFavorite = mapIsFavorite(imageAsset.isFavorite)
    )
  }

  private suspend fun toDto(videoAsset: MediaStoreVideoAsset): AssetInfo {
    val contentUri = extractAssetContentUri(
      videoAsset.id,
      MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO
    )

    return AssetInfo(
      id = contentUri,
      uri = mapUri(videoAsset.data) ?: contentUri,
      mediaType = MediaType.VIDEO,
      width = mapWidth(videoAsset.width, contentUri) ?: 0,
      height = mapHeight(videoAsset.height, contentUri) ?: 0,
      creationTime = mapCreationTime(videoAsset.dateTaken),
      modificationTime = mapModificationTime(videoAsset.dateModified),
      duration = mapDuration(videoAsset.duration),
      filename = videoAsset.displayName ?: throw AssetPropertyNotFoundException("Filename"),
      isFavorite = mapIsFavorite(videoAsset.isFavorite)
    )
  }

  private fun toDto(audioAsset: MediaStoreAudioAsset): AssetInfo {
    val contentUri = extractAssetContentUri(
      audioAsset.id,
      MediaStore.Files.FileColumns.MEDIA_TYPE_AUDIO
    )

    return AssetInfo(
      id = contentUri,
      uri = mapUri(audioAsset.data) ?: contentUri,
      mediaType = MediaType.AUDIO,
      width = 0,
      height = 0,
      creationTime = mapCreationTime(audioAsset.dateTaken),
      modificationTime = mapModificationTime(audioAsset.dateModified),
      duration = mapDuration(audioAsset.duration),
      filename = audioAsset.displayName ?: throw AssetPropertyNotFoundException("Filename"),
      isFavorite = mapIsFavorite(audioAsset.isFavorite)
    )
  }

  fun toMetadata(mediaStoreItem: AssetMediaStoreItem): AssetMetadata =
    when (mediaStoreItem) {
      is AssetMediaStoreItem.Image -> toMetadata(mediaStoreItem.asset)
      is AssetMediaStoreItem.Video -> toMetadata(mediaStoreItem.asset)
      is AssetMediaStoreItem.Audio -> toMetadata(mediaStoreItem.asset)
    }

  private fun toMetadata(imageAsset: MediaStoreImageAsset) =
    AssetMetadata(
      id = extractAssetContentUri(imageAsset.id, MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE),
      mediaType = MediaType.IMAGE,
      width = imageAsset.width,
      height = imageAsset.height,
      creationTime = mapCreationTime(imageAsset.dateTaken),
      modificationTime = mapModificationTime(imageAsset.dateModified),
      duration = null,
      filename = imageAsset.displayName ?: throw AssetPropertyNotFoundException("Filename"),
      isFavorite = mapIsFavorite(imageAsset.isFavorite)
    )

  private fun toMetadata(videoAsset: MediaStoreVideoAsset) =
    AssetMetadata(
      id = extractAssetContentUri(videoAsset.id, MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO),
      mediaType = MediaType.VIDEO,
      width = videoAsset.width,
      height = videoAsset.height,
      creationTime = mapCreationTime(videoAsset.dateTaken),
      modificationTime = mapModificationTime(videoAsset.dateModified),
      duration = mapDuration(videoAsset.duration),
      filename = videoAsset.displayName ?: throw AssetPropertyNotFoundException("Filename"),
      isFavorite = mapIsFavorite(videoAsset.isFavorite)
    )

  private fun toMetadata(audioAsset: MediaStoreAudioAsset) =
    AssetMetadata(
      id = extractAssetContentUri(audioAsset.id, MediaStore.Files.FileColumns.MEDIA_TYPE_AUDIO),
      mediaType = MediaType.AUDIO,
      width = null,
      height = null,
      creationTime = mapCreationTime(audioAsset.dateTaken),
      modificationTime = mapModificationTime(audioAsset.dateModified),
      duration = mapDuration(audioAsset.duration),
      filename = audioAsset.displayName ?: throw AssetPropertyNotFoundException("Filename"),
      isFavorite = mapIsFavorite(audioAsset.isFavorite)
    )

  suspend fun mapHeight(mediaStoreHeight: Int?, contentUri: Uri): Int? {
    return transformDimension(mediaStoreHeight, contentUri) {
      downloadBitmapAndGet(contentUri) { it.outHeight }
    }
  }

  suspend fun mapWidth(mediaStoreWidth: Int?, contentUri: Uri): Int? {
    return transformDimension(mediaStoreWidth, contentUri) {
      downloadBitmapAndGet(contentUri) { it.outWidth }
    }
  }

  private suspend fun transformDimension(
    mediaStoreDimension: Int?,
    contentUri: Uri,
    fallback: suspend () -> Int?
  ): Int? {
    val isImage = MediaType.fromContentUri(contentUri) == MediaType.IMAGE
    return when {
      isImage && (mediaStoreDimension == null || mediaStoreDimension <= 0) -> fallback()
      mediaStoreDimension != null && mediaStoreDimension > 0 -> mediaStoreDimension
      else -> null
    }
  }

  private suspend fun downloadBitmapAndGet(
    contentUri: Uri,
    extract: (BitmapFactory.Options) -> Int
  ): Int = withContext(Dispatchers.IO) {
    val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    val path = contentResolver.queryAssetData(contentUri)
    BitmapFactory.decodeFile(path, options)
    return@withContext extract(options)
  }

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
