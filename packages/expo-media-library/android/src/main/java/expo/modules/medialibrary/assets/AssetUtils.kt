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
  if (!cursor.moveToPosition(offset)) {
    return
  }
  val missingDimensionsAssets = mutableListOf<PendingAsset>()
  val pendingFullInfoAssets = mutableListOf<PendingAsset>()
  var i = 0
  while (i < limit && !cursor.isAfterLast) {
    val assetId = cursor.getString(idIndex)
    val path = cursor.getString(localUriIndex)
    val localUri = "file://$path"
    val mediaType = cursor.getInt(mediaTypeIndex)
    val dimensions = getAssetDimensionsFromCursorFast(cursor, mediaType)
    val width = dimensions?.first ?: 0
    val height = dimensions?.second ?: 0
    val asset = Bundle().apply {
      putString("id", assetId)
      putString("filename", cursor.getString(filenameIndex))
      putString("uri", localUri)
      putString("mediaType", exportMediaType(mediaType))
      putLong("width", width.toLong())
      putLong("height", height.toLong())
      putLong("creationTime", cursor.getLong(creationDateIndex))
      putDouble("modificationTime", cursor.getLong(modificationDateIndex) * 1000.0)
      putDouble("duration", cursor.getInt(durationIndex) / 1000.0)
      putString("albumId", cursor.getString(albumIdIndex))
    }
    if (dimensions == null) {
      missingDimensionsAssets.add(PendingAsset(asset, path, mediaType))
    }
    if (resolveWithFullInfo && mediaType == MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE) {
      pendingFullInfoAssets.add(PendingAsset(asset, path, mediaType))
    }
    cursor.moveToNext()
    response.add(asset)
    i++
  }

  withContext(exifReadDispatcher) {
    // These assets have missing dimensions that require opening the file to read. We do this in
    // parallel so it runs more quickly.
    if (missingDimensionsAssets.isNotEmpty()) {
      missingDimensionsAssets.map { pending ->
        async {
          val (width, height) = getAssetDimensionsSlow(
            contentResolver,
            pending.path,
            pending.mediaType,
            pending.asset.getLong("width").toInt(),
            pending.asset.getLong("height").toInt()
          )
          pending.asset.putLong("width", width.toLong())
          pending.asset.putLong("height", height.toLong())
        }
      }.awaitAll()
    }

    // When resolveWithFullInfo is true, per-file EXIF data (including GPS location) is read in
    // parallel across exifReadDispatcher instead of sequentially.
    //
    // - EXIF location reads cost ~15ms per image sequentially. They are independent per-file I/O,
    //   so parallelizing them speeds up large queries by several times.
    // - Cursor access is not thread-safe. Paths are copied into pending asset lists during the
    //   cursor loop before parallel file work; workers never touch the cursor.
    if (pendingFullInfoAssets.isNotEmpty()) {
      pendingFullInfoAssets.map { pending ->
        async {
          val localUri = "file://${pending.path}"
          val assetId = pending.asset.getString("id") ?: return@async
          val exifInterface = try {
            ExifInterface(pending.path)
          } catch (e: IOException) {
            Log.w("expo-media-library", "Could not parse EXIF tags for $localUri")
            e.printStackTrace()
            return@async
          }

          getRotatedImageDimensions(
            exifInterface,
            pending.asset.getLong("width").toInt(),
            pending.asset.getLong("height").toInt()
          )?.let { (resolvedWidth, resolvedHeight) ->
            pending.asset.putLong("width", resolvedWidth.toLong())
            pending.asset.putLong("height", resolvedHeight.toLong())
          }

          getExifFullInfo(exifInterface, pending.asset)

          val location = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val photoUri = Uri.withAppendedPath(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, assetId)
            getExifLocationForUri(contentResolver, photoUri)
          } else {
            getExifLocationLegacy(exifInterface)
          }
          pending.asset.putParcelable("location", location)
          pending.asset.putString("localUri", localUri)
        }
      }.awaitAll()
    }
  }
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
 * Gets image/video dimensions from MediaStore cursor columns (no file I/O).
 * @return Rotated dimensions, or `null` if width/height are not yet indexed.
 */
fun getAssetDimensionsFromCursorFast(
  cursor: Cursor,
  mediaType: Int
): Pair<Int, Int>? {
  if (mediaType == MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO) {
    // Fast path: read dimensions from MediaStore cursor (no file I/O).
    // MediaStore populates these when the media scanner indexes the file.
    val widthIndex = cursor.getColumnIndex(MediaStore.MediaColumns.WIDTH)
    val heightIndex = cursor.getColumnIndex(MediaStore.MediaColumns.HEIGHT)
    val width = cursor.getInt(widthIndex)
    val height = cursor.getInt(heightIndex)
    if (width > 0 && height > 0) {
      val orientationIndex = cursor.getColumnIndex(MediaStore.MediaColumns.ORIENTATION)
      val orientation = cursor.getInt(orientationIndex)

      return maybeRotateAssetSize(width, height, orientation)
    }

    return null
  }

  val widthIndex = cursor.getColumnIndex(MediaStore.MediaColumns.WIDTH)
  val heightIndex = cursor.getColumnIndex(MediaStore.MediaColumns.HEIGHT)
  val orientationIndex = cursor.getColumnIndex(MediaStore.Images.Media.ORIENTATION)
  val width = cursor.getInt(widthIndex)
  val height = cursor.getInt(heightIndex)
  val orientation = cursor.getInt(orientationIndex)

  // If the image doesn't have the required information, we can get them from Bitmap.Options
  if (mediaType == MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE && (width <= 0 || height <= 0)) {
    return null
  }
  return maybeRotateAssetSize(width, height, orientation)
}

/**
 * Gets asset dimensions via file I/O when cursor columns are missing.
 * @return Pair of integers: width and height, respectively
 */
@Throws(IOException::class)
fun getAssetDimensionsSlow(
  contentResolver: ContentResolver,
  path: String,
  mediaType: Int,
  width: Int,
  height: Int
): Pair<Int, Int> {
  if (mediaType == MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO) {
    // Slow fallback for files not yet indexed by the media scanner.
    val videoUri = Uri.parse("file://$path")
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
      Log.e("expo-media-library", "ContentResolver failed to read $path: ${e.message}")
    } catch (e: RuntimeException) {
      Log.e("expo-media-library", "MediaMetadataRetriever finished with unexpected error: ${e.message}")
    }
    return Pair(0, 0)
  }

  var resolvedWidth = width
  var resolvedHeight = height
  if (resolvedWidth <= 0 || resolvedHeight <= 0) {
    val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeFile(path, options)
    resolvedWidth = options.outWidth
    resolvedHeight = options.outHeight
  }
  return Pair(resolvedWidth, resolvedHeight)
}

/**
 * Returns rotated image dimensions when EXIF orientation requires swapping width and height.
 * @return Rotated dimensions, or `null` if no rotation is needed
 */
fun getRotatedImageDimensions(
  exifInterface: ExifInterface,
  width: Int,
  height: Int
): Pair<Int, Int>? {
  val exifOrientation = exifInterface.getAttributeInt(
    ExifInterface.TAG_ORIENTATION,
    ExifInterface.ORIENTATION_NORMAL
  )
  if (exifOrientation == ExifInterface.ORIENTATION_ROTATE_90 ||
    exifOrientation == ExifInterface.ORIENTATION_ROTATE_270 ||
    exifOrientation == ExifInterface.ORIENTATION_TRANSPOSE ||
    exifOrientation == ExifInterface.ORIENTATION_TRANSVERSE
  ) {
    return maybeRotateAssetSize(width, height, 90)
  }
  return null
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
 * Bounded parallelism for per-file EXIF reads.
 *
 * The ceiling is not Dispatchers.IO (elastic, default 64+). Location reads
 * call MediaStore.setRequireOriginal + openInputStream, which are Binder
 * IPCs into MediaProvider. libbinder's default thread pool is 15 threads
 * ([1]), shared across apps, so concurrency much past ~32 mostly queues on
 * Binder rather than speeding up.
 *
 * This matches our experimental findings. 32 seems to be a good concurrency.
 * Here are the times to fetch per photo for a group of 300 photos, as tested
 * with the demo app's MediaLibraryScreen:
 *
 * - 16: 4.02 ms
 * - 32: 2.78 ms
 * - 64: 3.12 ms
 * - 128: 3.19 ms
 *
 * [1]: https://source.android.com/docs/core/architecture/ipc/binder-threading#configure
 * Scoped storage location path: https://developer.android.com/training/data-storage/shared/media#location-info-photos
 */
@OptIn(ExperimentalCoroutinesApi::class)
private val exifReadDispatcher = Dispatchers.IO.limitedParallelism(32)

private data class PendingAsset(
  val asset: Bundle,
  val path: String,
  val mediaType: Int
)
