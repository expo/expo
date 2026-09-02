package expo.modules.medialibrary.assets

import android.content.ContentUris
import android.content.Context
import android.os.Build
import android.provider.MediaStore
import expo.modules.medialibrary.AssetNotFound
import expo.modules.medialibrary.AssetQueryException
import expo.modules.medialibrary.EXTERNAL_CONTENT_URI
import expo.modules.medialibrary.UnableToLoadException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import kotlin.coroutines.coroutineContext

suspend fun getAssetContentUri(context: Context, assetId: String): String = withContext(Dispatchers.IO) {
  val projection = arrayOf(
    MediaStore.Files.FileColumns._ID,
    MediaStore.Files.FileColumns.MEDIA_TYPE
  )
  val selection = "${MediaStore.Files.FileColumns._ID}=?"
  val selectionArgs = arrayOf(assetId)

  try {
    context.contentResolver.query(
      EXTERNAL_CONTENT_URI,
      projection,
      selection,
      selectionArgs,
      null
    ).use { assetCursor ->
      coroutineContext.ensureActive()
      if (assetCursor == null) {
        throw AssetQueryException()
      }
      if (!assetCursor.moveToFirst()) {
        throw AssetNotFound(assetId)
      }
      val idColumn = assetCursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns._ID)
      val mediaTypeColumn = assetCursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.MEDIA_TYPE)
      val id = assetCursor.getLong(idColumn)
      val mediaType = if (assetCursor.isNull(mediaTypeColumn)) {
        null
      } else {
        assetCursor.getInt(mediaTypeColumn)
      }

      val baseUri = if (Build.VERSION.SDK_INT == Build.VERSION_CODES.Q) {
        when (mediaType) {
          MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE -> MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
          MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO -> MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
          MediaStore.Files.FileColumns.MEDIA_TYPE_AUDIO -> MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
          else -> MediaStore.Files.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
        }
      } else {
        when (mediaType) {
          MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE -> MediaStore.Images.Media.EXTERNAL_CONTENT_URI
          MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO -> MediaStore.Video.Media.EXTERNAL_CONTENT_URI
          MediaStore.Files.FileColumns.MEDIA_TYPE_AUDIO -> MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
          else -> EXTERNAL_CONTENT_URI
        }
      }

      return@withContext ContentUris.withAppendedId(baseUri, id).toString()
    }
  } catch (e: SecurityException) {
    throw UnableToLoadException("Could not get asset: need READ_EXTERNAL_STORAGE permission", e)
  }
}
