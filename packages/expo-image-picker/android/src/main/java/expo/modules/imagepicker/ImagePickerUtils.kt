package expo.modules.imagepicker

import android.app.Application
import android.content.ContentResolver
import android.net.Uri
import android.util.Log
import android.webkit.MimeTypeMap
import androidx.core.content.FileProvider
import androidx.exifinterface.media.ExifInterface
import expo.modules.core.utilities.FileUtilities.generateOutputPath
import expo.modules.core.utilities.ifNull
import java.io.File
import java.io.IOException

private fun getTypeFromFileUrl(url: String): String? {
  val extension = MimeTypeMap.getFileExtensionFromUrl(url)
  return if (extension != null) MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension) else null
}

fun createOutputFile(cacheDir: File, extension: String): File? {
  return try {
    File(generateOutputPath(cacheDir, "ImagePicker", extension))
      .apply {
        createNewFile()
      }
  } catch (e: IOException) {
    null
  }
}

fun getType(contentResolver: ContentResolver, uri: Uri): String? {
  return contentResolver.getType(uri).ifNull {
    // previous method sometimes returns null
    getTypeFromFileUrl(uri.toString())
  }
}

fun contentUriFromFile(file: File, application: Application): Uri {
  return try {
    FileProvider.getUriForFile(application, application.packageName + ".ImagePickerFileProvider", file)
  } catch (e: Exception) {
    Uri.fromFile(file)
  }
}

// http://stackoverflow.com/a/38858040/1771921
fun uriFromFile(file: File): Uri = Uri.fromFile(file)

fun uriFromFilePath(path: String) = uriFromFile(File(path))

fun deduceExtension(type: String): String = when {
  type.contains("png") -> ".png"
  type.contains("gif") -> ".gif"
  type.contains("bmp") -> ".bmp"
  !type.contains("jpeg") -> {
    Log.w(ImagePickerConstants.TAG, "Image type not supported. Falling back to JPEG instead.")
    ".jpg"
  }
  else -> ".jpg"
}

class ExifDataHandler(private val uri: Uri) {
  fun copyExifData(newUri: Uri, contentResolver: ContentResolver) {
    if (uri == newUri) {
      return
    }
    contentResolver.openInputStream(uri)?.use { input ->
      val oldExif = ExifInterface(input)
      newUri.path?.let {
        val newExif = ExifInterface(it)
        for ((_, exifTag) in ImagePickerConstants.exifTags) {
          val value = oldExif.getAttribute(exifTag)
          if (value != null &&
            exifTag != ExifInterface.TAG_IMAGE_LENGTH &&
            exifTag != ExifInterface.TAG_IMAGE_WIDTH &&
            exifTag != ExifInterface.TAG_PIXEL_X_DIMENSION &&
            exifTag != ExifInterface.TAG_PIXEL_Y_DIMENSION &&
            exifTag != ExifInterface.TAG_ORIENTATION
          ) {
            newExif.setAttribute(exifTag, value)
          }
        }
        newExif.saveAttributes()
      }
    }
  }
}
