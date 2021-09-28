package expo.modules.medialibrary.assets

import android.content.ContentResolver
import android.content.Context
import android.database.Cursor
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.util.Log
import androidx.exifinterface.media.ExifInterface
import expo.modules.core.Promise
import expo.modules.medialibrary.MediaLibraryConstants
import expo.modules.medialibrary.MediaLibraryUtils
import java.io.IOException
import java.lang.UnsupportedOperationException
import java.util.ArrayList

/**
 * Queries content resolver for a single asset.
 * Resolves `promise` with a single-element array of [Bundle]
 */
fun queryAssetInfo(
    context: Context,
    selection: String?,
    selectionArgs: Array<String>?,
    resolveWithFullInfo: Boolean,
    promise: Promise
) {
  val contentResolver = context.contentResolver
  try {
    contentResolver.query(
        MediaLibraryConstants.EXTERNAL_CONTENT,
        MediaLibraryConstants.ASSET_PROJECTION,
        selection,
        selectionArgs,
        null
    ).use { assetCursor ->
      if (assetCursor == null) {
        promise.reject(MediaLibraryConstants.ERROR_UNABLE_TO_LOAD, "Could not get asset. Query returns null.")
      } else {
        if (assetCursor.count == 1) {
          assetCursor.moveToFirst()
          val array = ArrayList<Bundle>()
          putAssetsInfo(contentResolver, assetCursor, array, limit = 1, offset = 0, resolveWithFullInfo)
          // actually we want to return just the first item, but array.getMap returns ReadableMap
          // which is not compatible with promise.resolve and there is no simple solution to convert
          // ReadableMap to WritableMap so it's easier to return an array and pick the first item on JS side
          promise.resolve(array)
        } else {
          promise.resolve(null)
        }
      }
    }
  } catch (e: SecurityException) {
    promise.reject(MediaLibraryConstants.ERROR_UNABLE_TO_LOAD_PERMISSION,
        "Could not get asset: need READ_EXTERNAL_STORAGE permission.", e)
  } catch (e: IOException) {
    promise.reject(MediaLibraryConstants.ERROR_IO_EXCEPTION, "Could not read file", e)
  } catch (e: UnsupportedOperationException) {
    e.printStackTrace()
    promise.reject(MediaLibraryConstants.ERROR_NO_PERMISSIONS, e.message)
  }
}

/**
 * Reads given `cursor` and saves the data to `response` param.
 * Reads `limit` rows, starting by `offset`.
 * Cursor must be a result of query with [MediaLibraryConstants.ASSET_PROJECTION] projection
 */
@Throws(IOException::class, UnsupportedOperationException::class)
fun putAssetsInfo(
    contentResolver: ContentResolver?,
    cursor: Cursor,
    response: MutableList<Bundle>,
    limit: Int,
    offset: Int,
    resolveWithFullInfo: Boolean
) {
  val idIndex = cursor.getColumnIndex(MediaStore.Images.Media._ID)
  val filenameIndex = cursor.getColumnIndex(MediaStore.Images.Media.DISPLAY_NAME)
  val mediaTypeIndex = cursor.getColumnIndex(MediaStore.Files.FileColumns.MEDIA_TYPE)
  val creationDateIndex = cursor.getColumnIndex(MediaStore.Images.Media.DATE_TAKEN)
  val modificationDateIndex = cursor.getColumnIndex(MediaStore.Images.Media.DATE_MODIFIED)
  val durationIndex = cursor.getColumnIndex(MediaStore.Video.VideoColumns.DURATION)
  val localUriIndex = cursor.getColumnIndex(MediaStore.Images.Media.DATA)
  val albumIdIndex = cursor.getColumnIndex(MediaStore.Images.Media.BUCKET_ID)
  if (!cursor.moveToPosition(offset)) {
    return
  }
  var i = 0
  while (i < limit && !cursor.isAfterLast) {
    val path = cursor.getString(localUriIndex)
    val localUri = "file://$path"
    val mediaType = cursor.getInt(mediaTypeIndex)
    var exifInterface: ExifInterface? = null
    if (mediaType == MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE) {
      try {
        exifInterface = ExifInterface(path)
      } catch (e: IOException) {
        Log.w("expo-media-library", "Could not parse EXIF tags for $localUri")
        e.printStackTrace()
      }
    }
    val size = MediaLibraryUtils.getSizeFromCursor(contentResolver, exifInterface, cursor, mediaType, localUriIndex)
    val asset = Bundle().apply {
      putString("id", cursor.getString(idIndex))
      putString("filename", cursor.getString(filenameIndex))
      putString("uri", localUri)
      putString("mediaType", MediaLibraryUtils.exportMediaType(mediaType))
      putLong("width", size[0].toLong())
      putLong("height", size[1].toLong())
      putLong("creationTime", cursor.getLong(creationDateIndex))
      putDouble("modificationTime", cursor.getLong(modificationDateIndex) * 1000.0)
      putDouble("duration", cursor.getInt(durationIndex) / 1000.0)
      putString("albumId", cursor.getString(albumIdIndex))
    }
    if (resolveWithFullInfo) {
      if (exifInterface != null) {
        MediaLibraryUtils.getExifFullInfo(exifInterface, asset)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          val photoUri = Uri.withAppendedPath(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, cursor.getString(idIndex))
          MediaLibraryUtils.getExifLocationForUri(contentResolver, photoUri, asset)
        } else {
          MediaLibraryUtils.getExifLocation(exifInterface, asset)
        }
        asset.putString("localUri", localUri)
      }
    }
    cursor.moveToNext()
    response.add(asset)
    i++
  }
}
