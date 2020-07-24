package expo.modules.imagepicker.tasks

import android.content.ContentResolver
import android.net.Uri
import android.os.Bundle
import android.util.Base64
import android.util.Log
import androidx.exifinterface.media.ExifInterface
import expo.modules.imagepicker.ImagePickerConstants
import expo.modules.imagepicker.ImagePickerConstants.CACHE_DIR_NAME
import expo.modules.imagepicker.ImagePickerConstants.TAG
import expo.modules.imagepicker.ImagePickerConstants.exifTags
import expo.modules.imagepicker.exporters.ImageExporter
import expo.modules.imagepicker.exporters.ImageExporter.Listener
import org.unimodules.core.Promise
import org.unimodules.core.utilities.FileUtilities.generateOutputPath
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.IOException

open class ImageResultTask(promise: Promise,
                           uri: Uri,
                           contentResolver: ContentResolver,
                           cacheDir: File,
                           private val mExifData: Boolean,
                           private val mType: String,
                           private val mImageExporter: ImageExporter)
  : ImagePickerResultTask(promise, uri, contentResolver, cacheDir) {

  override fun doInBackground(vararg params: Void?): Void? {
    try {
      val outputFile = outputFile
      val exif: Bundle? = exifData
      mImageExporter.export(uri, outputFile, object : Listener {
        override fun onResult(out: ByteArrayOutputStream?, width: Int, height: Int) {
          val response = Bundle().apply {
            putString("uri", outputFile.toURI().toString())
            putInt("width", width)
            putInt("height", height)
            putBoolean("cancelled", false)
            putString("type", "image")

            out?.let {
              putString("base64", Base64.encodeToString(it.toByteArray(), Base64.NO_WRAP))
            }
            exif?.let {
              putBundle("exif", it)
            }
          }
          promise.resolve(response)
        }

        override fun onFailure(cause: Throwable?) {
          promise.reject(ImagePickerConstants.ERR_CAN_NOT_SAVE_RESULT, ImagePickerConstants.CAN_NOT_SAVE_RESULT_MESSAGE, cause)
        }
      })
    } catch (e: IOException) {
      promise.reject(ImagePickerConstants.ERR_CAN_NOT_EXTRACT_METADATA, ImagePickerConstants.CAN_NOT_EXTRACT_METADATA_MESSAGE, e)
    }

    return null
  }

  @get:Throws(IOException::class)
  protected open val outputFile: File
    get() = File(generateOutputPath(cacheDir, CACHE_DIR_NAME, deduceExtension()))


  private fun deduceExtension(): String {
    return when {
      mType.contains("png") -> ".png"
      mType.contains("gif") -> ".gif"
      mType.contains("bmp") -> ".bmp"
      !mType.contains("jpeg") -> {
        Log.w(TAG, "Image type not supported. Falling back to JPEG instead.")
        return ".jpg"
      }
      else -> ".jpg"
    }
  }

  @get:Throws(IOException::class)
  private val exifData: Bundle?
    get() = if (mExifData) readExif() else null

  @Throws(IOException::class)
  private fun readExif() = Bundle().apply {
    contentResolver.openInputStream(uri)?.use { input ->
      val exifInterface = ExifInterface(input)
      exifTags.forEach { (type, name) ->
        if (exifInterface.getAttribute(name) != null) {
          when (type) {
            "string" -> putString(name, exifInterface.getAttribute(name))
            "int" -> putInt(name, exifInterface.getAttributeInt(name, 0))
            "double" -> putDouble(name, exifInterface.getAttributeDouble(name, 0.0))
          }
        }
      }

      // Explicitly get latitude, longitude, altitude with their specific accessor functions.
      exifInterface.latLong?.let { latLong ->
        putDouble(ExifInterface.TAG_GPS_LATITUDE, latLong[0])
        putDouble(ExifInterface.TAG_GPS_LONGITUDE, latLong[1])
        putDouble(ExifInterface.TAG_GPS_ALTITUDE, exifInterface.getAltitude(0.0))
      }
    }
  }
}
