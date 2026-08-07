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
import expo.modules.medialibrary.ASSET_PROJECTION
import expo.modules.medialibrary.AssetQueryException
import expo.modules.medialibrary.EXTERNAL_CONTENT_URI
import expo.modules.medialibrary.EXIF_TAGS
import expo.modules.medialibrary.MediaType
import expo.modules.medialibrary.UnableToLoadException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import java.io.FileNotFoundException
import java.io.IOException
import java.lang.NumberFormatException
import java.lang.RuntimeException
import java.lang.UnsupportedOperationException
import kotlin.coroutines.coroutineContext
import kotlin.math.abs

/**
 * Queries content resolver for a single asset.
 * Resolves [promise] with a single-element array of [Bundle]
 */
suspend fun queryAssetInfo(
  context: Context,
  selection: String?,
  selectionArgs: Array<String>?,
  resolveWithFullInfo: Boolean
): ArrayList<Bundle>? = withContext(Dispatchers.IO) {
  val contentResolver = context.contentResolver
  try {
    contentResolver.query(
      EXTERNAL_CONTENT_URI,
      ASSET_PROJECTION,
      selection,
      selectionArgs,
      null
    ).use { assetCursor ->
      coroutineContext.ensureActive()
      if (assetCursor == null) {
        throw AssetQueryException()
      } else {
        if (assetCursor.count == 1) {
          assetCursor.moveToFirst()
          val array = arrayListOf<Bundle>()
          putAssetsInfo(contentResolver, assetCursor, array, limit = 1, offset = 0, resolveWithFullInfo)
          // actually we want to return just the first item, but array.getMap returns ReadableMap
          // which is not compatible with promise.resolve and there is no simple solution to convert
          // ReadableMap to WritableMap so it's easier to return an array and pick the first item on JS side
          return@withContext array
        } else {
          return@withContext null
        }
      }
    }
  } catch (e: Exception) {
    throw when (e) {
      is SecurityException -> UnableToLoadException("Could not get asset: need READ_EXTERNAL_STORAGE permission", e)
      is IOException -> UnableToLoadException("Could not read file ${e.message}", e)
      is UnsupportedOperationException -> UnableToLoadException(e.message ?: "Invalid MediaType", e)
      else -> e
    }
  }
}

/**
 * Reads given `cursor` and saves the data to `response` param.
 * Reads `limit` rows, starting by `offset`.
 * Cursor must be a result of query with [ASSET_PROJECTION] projection
 *
 * When [resolveWithFullInfo] is true, per-file EXIF data (including GPS
 * location) is read in parallel across [exifReadDispatcher] instead of
 * sequentially. EXIF location reads cost ~15ms per image sequentially;
 * they are independent per-file I/O, so parallelizing them speeds up large
 * queries by several times. Cursor access is not thread-safe, so all cursor
 * columns are copied into [AssetRowData] first; the parallel workers never
 * touch the cursor. Iteration matches the original sequential loop
 * (moveToPosition, then moveToNext per row) so the cursor's final position
 * — which callers read for `hasNextPage`/`endCursor` — is unchanged.
 */
@Throws(IOException::class, UnsupportedOperationException::class)
suspend fun putAssetsInfo(
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
  // Read dimension columns here so parallel workers never touch the cursor.
  val widthIndex = cursor.getColumnIndex(MediaStore.MediaColumns.WIDTH)
  val heightIndex = cursor.getColumnIndex(MediaStore.MediaColumns.HEIGHT)
  val orientationIndex = cursor.getColumnIndex(MediaStore.Images.Media.ORIENTATION)

  val rows = mutableListOf<AssetRowData>()
  if (!cursor.moveToPosition(offset)) {
    return
  }
  var i = 0
  while (i < limit && !cursor.isAfterLast) {
    rows.add(
      AssetRowData(
        assetId = cursor.getString(idIndex),
        filename = cursor.getString(filenameIndex),
        path = cursor.getString(localUriIndex),
        mediaType = cursor.getInt(mediaTypeIndex),
        creationTime = cursor.getLong(creationDateIndex),
        modificationTime = cursor.getLong(modificationDateIndex),
        durationMs = cursor.getInt(durationIndex),
        albumId = cursor.getString(albumIdIndex),
        width = cursor.getInt(widthIndex),
        height = cursor.getInt(heightIndex),
        orientation = cursor.getInt(orientationIndex)
      )
    )
    cursor.moveToNext()
    i++
  }

  val bundles = withContext(exifReadDispatcher) {
    rows.map { row ->
      async {
        val localUri = "file://${row.path}"
        var exifInterface: ExifInterface? = null
        if (resolveWithFullInfo && row.mediaType == MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE) {
          try {
            exifInterface = ExifInterface(row.path)
          } catch (e: IOException) {
            Log.w("expo-media-library", "Could not parse EXIF tags for $localUri")
            e.printStackTrace()
          }
        }
        val (width, height) = getAssetDimensions(contentResolver, row, exifInterface)
        val asset = Bundle().apply {
          putString("id", row.assetId)
          putString("filename", row.filename)
          putString("uri", localUri)
          putString("mediaType", exportMediaType(row.mediaType))
          putLong("width", width.toLong())
          putLong("height", height.toLong())
          putLong("creationTime", row.creationTime)
          putDouble("modificationTime", row.modificationTime * 1000.0)
          putDouble("duration", row.durationMs / 1000.0)
          putString("albumId", row.albumId)
        }
        if (resolveWithFullInfo && exifInterface != null) {
          getExifFullInfo(exifInterface, asset)

          val location = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val photoUri = Uri.withAppendedPath(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, row.assetId)
            getExifLocationForUri(contentResolver, photoUri)
          } else {
            getExifLocationLegacy(exifInterface)
          }
          asset.putParcelable("location", location)
          asset.putString("localUri", localUri)
        }
        asset
      }
    }.awaitAll()
  }
  response.addAll(bundles)
}

fun getExifFullInfo(exifInterface: ExifInterface, response: Bundle) {
  val exifMap = Bundle()
  for ((type, name) in EXIF_TAGS) {
    if (exifInterface.getAttribute(name) != null) {
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
 * API 29+ adds "scoped storage" which requires extra permissions (`ACCESS_MEDIA_LOCATION`) to access photo data.
 * Reference: [Android docs](https://developer.android.com/training/data-storage/shared/media#location-info-photos)
 * @returns [Bundle] with latitude and longitude or `null` if fail
 * @throws UnsupportedOperationException when `ACCESS_MEDIA_LOCATION` permission isn't granted
 */
@RequiresApi(api = Build.VERSION_CODES.Q)
@Throws(UnsupportedOperationException::class, IOException::class)
fun getExifLocationForUri(contentResolver: ContentResolver, photoUri: Uri): Bundle? {
  try {
    // Exception occurs here if ACCESS_MEDIA_LOCATION permission isn't granted
    val uri = MediaStore.setRequireOriginal(photoUri)

    return contentResolver.openInputStream(uri)?.use { stream ->
      ExifInterface(stream)
        .latLong
        ?.let { (lat, lng) ->
          Bundle().apply {
            putDouble("latitude", lat)
            putDouble("longitude", lng)
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
  val latLong = exifInterface.latLong ?: return null
  return Bundle().apply {
    putDouble("latitude", latLong[0])
    putDouble("longitude", latLong[1])
  }
}

/**
 * Gets image/video dimensions from the already-read cursor columns.
 *
 * For videos, prefers MediaStore `WIDTH`/`HEIGHT`/`ORIENTATION` (see [1])
 * and falls back to MediaMetadataRetriever when the scanner has not indexed
 * the file yet. For images, uses the same cursor columns with
 * BitmapFactory and EXIF orientation handling when dimensions are missing.
 *
 * [1]: https://developer.android.com/reference/android/provider/MediaStore.MediaColumns#WIDTH
 *
 * @return Pair of integers: width and height, respectively
 */
private fun getAssetDimensions(
  contentResolver: ContentResolver,
  row: AssetRowData,
  exifInterface: ExifInterface?
): Pair<Int, Int> {
  if (row.mediaType == MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO) {
    if (row.width > 0 && row.height > 0) {
      return maybeRotateAssetSize(row.width, row.height, row.orientation)
    }
    // Slow fallback for files not yet indexed by the media scanner.
    val videoUri = Uri.parse("file://${row.path}")
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
      Log.e("expo-media-library", "ContentResolver failed to read ${row.path}: ${e.message}")
    } catch (e: RuntimeException) {
      Log.e("expo-media-library", "MediaMetadataRetriever finished with unexpected error: ${e.message}")
    }
    return Pair(0, 0)
  }

  var width = row.width
  var height = row.height
  var orientation = row.orientation

  if (width <= 0 || height <= 0) {
    val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeFile(row.path, options)
    width = options.outWidth
    height = options.outHeight
  }
  if (exifInterface != null) {
    val exifOrientation = exifInterface.getAttributeInt(
      ExifInterface.TAG_ORIENTATION,
      ExifInterface.ORIENTATION_NORMAL
    )
    // Full list of orientations are here: https://developer.android.com/reference/android/media/ExifInterface#summary
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
 * Converts [MediaStore] media type into MediaLibrary [MediaType] api constant
 */
fun exportMediaType(mediaType: Int) = when (mediaType) {
  MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE -> MediaType.PHOTO
  MediaStore.Files.FileColumns.MEDIA_TYPE_AUDIO,
  @Suppress("DEPRECATION") // MEDIA_TYPE_PLAYLIST is deprecated, we keep it for backward compatibility, however it has been removed in the new API
  MediaStore.Files.FileColumns.MEDIA_TYPE_PLAYLIST
  -> MediaType.AUDIO
  MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO -> MediaType.VIDEO
  else -> MediaType.UNKNOWN
}.apiName

/**
 * Swaps `width` and `height` if the `orientation` is `90` or `-90`
 * @return Pair of integers: width and height, respectively
 */
fun maybeRotateAssetSize(width: Int, height: Int, orientation: Int): Pair<Int, Int> {
  // given width and height might need to be swapped if the orientation is -90 or 90
  return if (abs(orientation) % 180 == 90) {
    Pair(height, width)
  } else {
    Pair(width, height)
  }
}

/**
 * Bounded parallelism for per-file EXIF reads. Measured on a real device:
 * 8 → ~2.2ms/photo, 16 → ~1.8ms/photo; higher levels plateaued.
 *
 * The ceiling is not Dispatchers.IO (elastic, default 64+). Location reads
 * call MediaStore.setRequireOriginal + openInputStream, which are Binder
 * IPCs into MediaProvider. libbinder's default thread pool is 15 threads
 * ([1]), shared across apps, so concurrency much past ~16 mostly queues on
 * Binder rather than speeding up.
 *
 * [1]: https://source.android.com/docs/core/architecture/ipc/binder-threading#configure
 * Scoped storage location path: https://developer.android.com/training/data-storage/shared/media#location-info-photos
 */
@OptIn(ExperimentalCoroutinesApi::class)
private val exifReadDispatcher = Dispatchers.IO.limitedParallelism(16)

/** One cursor row's columns, copied out so file work can run off-cursor. */
private class AssetRowData(
  val assetId: String,
  val filename: String,
  val path: String,
  val mediaType: Int,
  val creationTime: Long,
  val modificationTime: Long,
  val durationMs: Int,
  val albumId: String?,
  val width: Int,
  val height: Int,
  val orientation: Int
)
