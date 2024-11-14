package expo.modules.clipboard

import android.content.ClipData
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageDecoder
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.util.Base64
import androidx.core.os.bundleOf
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runInterruptible
import kotlinx.coroutines.yield
import java.io.BufferedOutputStream
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.lang.StringBuilder

const val PNG_PREFIX = "iVBORw0K"
const val JPEG_PREFIX = "/9j/"

// region Structs and interfaces
data class ImageResult(
  val base64Image: String,
  val width: Int,
  val height: Int
) {
  fun toBundle() = bundleOf(
    "data" to base64Image,
    "size" to bundleOf(
      "width" to width,
      "height" to height
    )
  )
}
// endregion

// region Module functions

/**
 * Gets the image format from the base64 encoded image string by checking the prefix of
 * the base64
 *
 * @param base64Image base64 encoded image string
 *
 * @return ImageFormat
 */
internal fun getImageFormatFromBase64(base64Image: String): ImageFormat {
  val prefix = base64Image.substring(0, 8)
  return when {
    prefix.startsWith(PNG_PREFIX) -> ImageFormat.PNG
    prefix.startsWith(JPEG_PREFIX) -> ImageFormat.JPG
    else -> ImageFormat.JPG
  }
}

/**
 * Gets the [imageUri] and returns the [ImageResult] object containing base64 encoded image
 * and its metadata
 *
 * @param context
 * @param imageUri `content://` uri of the image to be resolved
 *
 * @throws IOException
 * @throws SecurityException when app has no permission to access the content uri
 */
internal suspend fun imageFromContentUri(
  context: Context,
  imageUri: Uri,
  options: GetImageOptions
): ImageResult {
  // 1. Retrieve bitmap from URI
  val bitmap = bitmapFromContentUriAsync(context, imageUri)

  // 2. Compress it to target format
  val format = options.imageFormat
  val quality = (options.jpegQuality * 100).toInt()
  val outputStream = ByteArrayOutputStream().also {
    bitmap.compress(format.compressFormat, quality, it)
  }
  yield()

  // 3. Convert to base64
  val byteArray = outputStream.toByteArray()
  val encodedString = Base64.encodeToString(byteArray, Base64.DEFAULT)
  val builder = StringBuilder("data:${format.mimeType};base64,").append(encodedString)

  return ImageResult(
    base64Image = builder.toString(),
    width = bitmap.width,
    height = bitmap.height
  )
}

/**
 * Gets base64-encoded image data and prepares it to be accessible by other applications
 * when pasting from clipboard
 *
 * Saves the image to the [clipboardCacheDir] directory, then uses [ClipboardFileProvider]
 * to create a `content://` URI which then is packed to the [ClipData] object.
 *
 * @param context
 * @param base64Image base64-encoded JPEG image data. Should not be prefixed
 * @param clipboardCacheDir directory where the copied image is stored, must be accessible by
 * the [ClipboardFileProvider]
 * @return clip data ready to be shared by the [android.content.ClipboardManager]
 */
internal suspend fun clipDataFromBase64Image(
  context: Context,
  base64Image: String,
  clipboardCacheDir: File
): ClipData {
  // 1. Get bitmap from base64 string
  val bitmap = bitmapFromBase64String(base64Image)

  // 2. Determine image format
  val format = getImageFormatFromBase64(base64Image)

  val fileName = when (format) {
    ImageFormat.PNG -> "copied_image.png"
    ImageFormat.JPG -> "copied_image.jpeg"
  }

  // 3. Create file in cache dir, it will be overwritten if already exists
  val file = File(clipboardCacheDir, fileName).also {
    it.ensureExists()
  }

  // 4. Write bitmap to the file
  val fileStream = runInterruptible { FileOutputStream(file, false) }
  BufferedOutputStream(fileStream).use { outputStream ->
    bitmap.compress(format.compressFormat, 100, outputStream)
    runInterruptible { outputStream.flush() }
  }

  // 5. Get content:// URI to the image file and put it to the clipboard data
  val imageUri = ClipboardFileProvider.getUriForFile(
    context,
    context.applicationInfo.packageName + ".ClipboardFileProvider",
    file
  )
  return ClipData.newUri(context.contentResolver, "image", imageUri)
}
// endregion

// region Utility functions

/**
 * Retrieves [Bitmap] from `content://` image uri
 * @throws SecurityException when app has no permission to access the content uri
 * @throws IOException
 */
internal suspend fun bitmapFromContentUriAsync(context: Context, imageUri: Uri): Bitmap =
  runInterruptible(Dispatchers.IO) {
    val contentResolver = context.contentResolver
    @Suppress("DEPRECATION")
    when {
      Build.VERSION.SDK_INT < 28 -> MediaStore.Images.Media.getBitmap(
        contentResolver,
        imageUri
      )
      else -> {
        val source = ImageDecoder.createSource(contentResolver, imageUri)
        ImageDecoder.decodeBitmap(source)
      }
    }
  }

internal fun bitmapFromBase64String(base64Image: String): Bitmap = try {
  val byteArray = Base64.decode(base64Image, Base64.DEFAULT)
  BitmapFactory.decodeByteArray(byteArray, 0, byteArray.size)
    ?: throw RuntimeException("Failed to convert base64 into Bitmap")
} catch (e: RuntimeException) {
  // Base64.decode throws IllegalArgumentException on invalid data, but
  // BitmapFactory.decodeByteArray returns null if data cannot be converted
  // so we aggregate both errors here
  throw InvalidImageException(base64Image, e)
}

/**
 * Creates the file and all its parent directories if they don't exist already.
 */
private suspend fun File.ensureExists() = runInterruptible(Dispatchers.IO) {
  parentFile?.mkdirs()
  createNewFile()
}
// endregion
