package expo.modules.medialibrary.next.objects.asset

import android.content.ContentResolver
import android.graphics.BitmapFactory
import android.net.Uri
import android.provider.MediaStore
import androidx.core.net.toUri
import expo.modules.medialibrary.assets.maybeRotateAssetSize
import expo.modules.medialibrary.next.exceptions.AssetPropertyNotFoundException
import expo.modules.medialibrary.next.extensions.resolver.extractAssetContentUri
import expo.modules.medialibrary.next.extensions.resolver.queryAssetData
import expo.modules.medialibrary.next.objects.asset.domain.AssetMediaStoreItem
import expo.modules.medialibrary.next.objects.asset.domain.MediaStoreAudio
import expo.modules.medialibrary.next.objects.asset.domain.MediaStoreFile
import expo.modules.medialibrary.next.objects.asset.domain.MediaStoreImage
import expo.modules.medialibrary.next.objects.asset.domain.MediaStoreVideo
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

  private suspend fun toDto(imageAsset: MediaStoreImage): AssetInfo {
    val contentUri = extractAssetContentUri(
      imageAsset.id,
      MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE
    )

    val (width, height) = mapDisplaySize(
      imageAsset.width,
      imageAsset.height,
      imageAsset.orientation,
      contentUri
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

  private suspend fun toDto(videoAsset: MediaStoreVideo): AssetInfo {
    val contentUri = extractAssetContentUri(
      videoAsset.id,
      MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO
    )

    val (width, height) = mapDisplaySize(
      videoAsset.width,
      videoAsset.height,
      videoAsset.orientation,
      contentUri
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
    val (width, height) = mapSize(fileAsset.width, fileAsset.height, fileAsset.orientation)
    return AssetMetadata(
      id = extractAssetContentUri(fileAsset.id, fileAsset.mediaType),
      mediaType = fileAsset.mediaType?.let { MediaType.fromMediaStoreValue(it) }
        ?: MediaType.UNKNOWN,
      width = width,
      height = height,
      creationTime = mapCreationTime(fileAsset.dateTaken),
      modificationTime = mapModificationTime(fileAsset.dateModified),
      duration = mapDuration(fileAsset.duration),
      filename = fileAsset.displayName,
      isFavorite = mapIsFavorite(fileAsset.isFavorite)
    )
  }

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

  // MediaStore's WIDTH/HEIGHT columns hold the raw pixel-buffer size; assets
  // with ORIENTATION 90 or 270 are displayed with the two swapped.
  fun mapSize(mediaStoreWidth: Int?, mediaStoreHeight: Int?, mediaStoreOrientation: Int?): Pair<Int?, Int?> =
    if (mediaStoreWidth != null && mediaStoreHeight != null) {
      maybeRotateAssetSize(mediaStoreWidth, mediaStoreHeight, mediaStoreOrientation ?: 0)
    } else {
      mediaStoreWidth to mediaStoreHeight
    }

  private suspend fun mapDisplaySize(
    mediaStoreWidth: Int?,
    mediaStoreHeight: Int?,
    mediaStoreOrientation: Int?,
    contentUri: Uri
  ): Pair<Int, Int> {
    val width = mapWidth(mediaStoreWidth, contentUri)
      ?: throw AssetPropertyNotFoundException("Width")
    val height = mapHeight(mediaStoreHeight, contentUri)
      ?: throw AssetPropertyNotFoundException("Height")
    return maybeRotateAssetSize(width, height, mediaStoreOrientation ?: 0)
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
