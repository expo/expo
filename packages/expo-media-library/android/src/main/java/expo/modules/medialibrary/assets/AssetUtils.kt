package expo.modules.medialibrary.assets

import android.content.ContentResolver
import android.content.Context
import android.database.Cursor
import android.graphics.BitmapFactory
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.exifinterface.media.ExifInterface
import expo.modules.core.Promise
import expo.modules.medialibrary.MediaLibraryConstants
import java.io.FileNotFoundException
import java.io.IOException
import java.lang.NumberFormatException
import java.lang.RuntimeException
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
    promise.reject(
      MediaLibraryConstants.ERROR_UNABLE_TO_LOAD_PERMISSION,
      "Could not get asset: need READ_EXTERNAL_STORAGE permission.", e
    )
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
  contentResolver: ContentResolver,
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
    val size = getAssetDimensionsFromCursor(contentResolver, exifInterface, cursor, mediaType, localUriIndex)
    val asset = Bundle().apply {
      putString("id", cursor.getString(idIndex))
      putString("filename", cursor.getString(filenameIndex))
      putString("uri", localUri)
      putString("mediaType", exportMediaType(mediaType))
      putLong("width", size[0].toLong())
      putLong("height", size[1].toLong())
      putLong("creationTime", cursor.getLong(creationDateIndex))
      putDouble("modificationTime", cursor.getLong(modificationDateIndex) * 1000.0)
      putDouble("duration", cursor.getInt(durationIndex) / 1000.0)
      putString("albumId", cursor.getString(albumIdIndex))
    }
    if (resolveWithFullInfo) {
      if (exifInterface != null) {
        getExifFullInfo(exifInterface, asset)

        val location = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          val photoUri = Uri.withAppendedPath(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, cursor.getString(idIndex))
          getExifLocationForUri(contentResolver, photoUri)
        } else {
          getExifLocationLegacy(exifInterface)
        }
        asset.putParcelable("location", location)
        asset.putString("localUri", localUri)
      }
    }
    cursor.moveToNext()
    response.add(asset)
    i++
  }
}

fun getExifFullInfo(exifInterface: ExifInterface, response: Bundle) {
  val exifMap = Bundle()
  for ((type, name) in MediaLibraryConstants.exifTags) {
    if (exifInterface.getAttribute(name!!) != null) {
      when (type) {
        "string" -> exifMap.putString(name, exifInterface.getAttribute(name))
        "int" -> exifMap.putInt(name, exifInterface.getAttributeInt(name, 0))
        "double" -> exifMap.putDouble(name, exifInterface.getAttributeDouble(name, 0.0))
      }
    }
  }
  response.putParcelable("exif", exifMap)
}

/**
 * API 29+ adds "scoped storage" which requires extra permissions (ACCESS_MEDIA_LOCATION) to access photo data
 * Reference: https://developer.android.com/training/data-storage/shared/media#location-info-photos
 * @returns [Bundle] with latitude and longitude or `null` if fail
 * @throws UnsupportedOperationException when `ACCESS_MEDIA_LOCATION` permission isn't granted
 */
@RequiresApi(api = Build.VERSION_CODES.Q)
@Throws(UnsupportedOperationException::class, IOException::class)
fun getExifLocationForUri(contentResolver: ContentResolver, photoUri: Uri): Bundle? {
  try {
    // Exception occurs here if ACCESS_MEDIA_LOCATION permission isn't granted
    val uri = MediaStore.setRequireOriginal(photoUri)

    return contentResolver.openInputStream(uri).use { stream ->
      ExifInterface(stream ?: return null)
        .latLong
        ?.let {
          Bundle().apply {
            putDouble("latitude", it[0])
            putDouble("longitude", it[1])
          }
        }
    }
  } catch (e: IOException) {
    Log.w("expo-media-library", "Could not parse EXIF tags for $photoUri")
    e.printStackTrace()
  } catch (e: UnsupportedOperationException) {
    throw UnsupportedOperationException("Cannot access ExifInterface because of missing ACCESS_MEDIA_LOCATION permission")
  }
  return null
}

/**
 * Used in API < 29.
 * For API 29+ please use [getExifLocationForUri] instead
 * @returns [Bundle] with latitude and longitude or `null` if fail
 */
fun getExifLocationLegacy(exifInterface: ExifInterface): Bundle? {
  val latLong = exifInterface.latLong
  if (latLong == null) {
    return null
  }
  return Bundle().apply {
    putDouble("latitude", latLong[0])
    putDouble("longitude", latLong[1])
  }
}

/**
 * Gets image/video dimensions
 * @return array of 2 integers: width and height, respectively
 */
@Throws(IOException::class)
fun getAssetDimensionsFromCursor(
  contentResolver: ContentResolver,
  exifInterface: ExifInterface?,
  cursor: Cursor,
  mediaType: Int,
  localUriColumnIndex: Int
): IntArray {
  val uri = cursor.getString(localUriColumnIndex)
  if (mediaType == MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO) {
    val videoUri = Uri.parse("file://$uri")
    try {
      contentResolver.openAssetFileDescriptor(videoUri, "r").use { photoDescriptor ->
        MediaMetadataRetriever().use { retriever ->
          retriever.setDataSource(photoDescriptor!!.fileDescriptor)
          val videoWidth =
            retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)!!.toInt()
          val videoHeight =
            retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)!!.toInt()
          val videoOrientation =
            retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)!!.toInt()

          return maybeRotateAssetSize(videoWidth, videoHeight, videoOrientation)
        }
      }
    } catch (e: NumberFormatException) {
      Log.e("expo-media-library", "MediaMetadataRetriever unexpectedly returned non-integer: ${e.message}")
    } catch (e: FileNotFoundException) {
      Log.e("expo-media-library", "ContentResolver failed to read $uri: ${e.message}")
    } catch (e: RuntimeException) {
      Log.e("expo-media-library", "MediaMetadataRetriever finished with unexpected error: ${e.message}")
    }
  }

  val widthIndex = cursor.getColumnIndex(MediaStore.MediaColumns.WIDTH)
  val heightIndex = cursor.getColumnIndex(MediaStore.MediaColumns.HEIGHT)
  val orientationIndex = cursor.getColumnIndex(MediaStore.Images.Media.ORIENTATION)
  var width = cursor.getInt(widthIndex)
  var height = cursor.getInt(heightIndex)
  var orientation = cursor.getInt(orientationIndex)

  // If the image doesn't have the required information, we can get them from Bitmap.Options
  if (mediaType == MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE && (width <= 0 || height <= 0)) {
    val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeFile(uri, options)
    width = options.outWidth
    height = options.outHeight
  }
  if (exifInterface != null) {
    val exifOrientation = exifInterface.getAttributeInt(
      ExifInterface.TAG_ORIENTATION,
      ExifInterface.ORIENTATION_NORMAL
    )
    if (exifOrientation == ExifInterface.ORIENTATION_ROTATE_90 ||
      exifOrientation == ExifInterface.ORIENTATION_ROTATE_270 ||
      exifOrientation == ExifInterface.ORIENTATION_TRANSPOSE ||
      exifOrientation == ExifInterface.ORIENTATION_TRANSVERSE
    ) {
      orientation = 90
    }
  }
  return maybeRotateAssetSize(width, height, orientation)
}

/**
 * Converts [MediaStore] media type into MediaLibrary media type constants
 */
fun exportMediaType(mediaType: Int): String {
  return when (mediaType) {
    MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE -> MediaLibraryConstants.MEDIA_TYPE_PHOTO
    MediaStore.Files.FileColumns.MEDIA_TYPE_AUDIO, MediaStore.Files.FileColumns.MEDIA_TYPE_PLAYLIST -> MediaLibraryConstants.MEDIA_TYPE_AUDIO
    MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO -> MediaLibraryConstants.MEDIA_TYPE_VIDEO
    else -> MediaLibraryConstants.MEDIA_TYPE_UNKNOWN
  }
}

/**
 * Swaps `width` and `height` if the `orientation` is `90` or `-90`
 */
fun maybeRotateAssetSize(width: Int, height: Int, orientation: Int): IntArray {
  // given width and height might need to be swapped if the orientation is -90 or 90
  return if (Math.abs(orientation) % 180 == 90) {
    intArrayOf(height, width)
  } else {
    intArrayOf(width, height)
  }
}
