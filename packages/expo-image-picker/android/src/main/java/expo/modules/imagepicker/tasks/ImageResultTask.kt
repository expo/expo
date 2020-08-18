package expo.modules.imagepicker.tasks

import android.content.ContentResolver
import android.net.Uri
import android.os.AsyncTask
import android.os.Bundle
import android.util.Base64
import androidx.exifinterface.media.ExifInterface
import expo.modules.imagepicker.ImagePickerConstants
import expo.modules.imagepicker.ImagePickerConstants.exifTags
import expo.modules.imagepicker.exporters.ImageExporter
import expo.modules.imagepicker.exporters.ImageExporter.Listener
import expo.modules.imagepicker.fileproviders.FileProvider
import org.unimodules.core.Promise
import java.io.ByteArrayOutputStream
import java.io.IOException

open class ImageResultTask(private val promise: Promise,
                           private val uri: Uri,
                           private val contentResolver: ContentResolver,
                           private val fileProvider: FileProvider,
                           private val withExifData: Boolean,
                           private val imageExporter: ImageExporter)
  : AsyncTask<Void?, Void?, Void?>() {

  override fun doInBackground(vararg params: Void?): Void? {
    try {
      val outputFile = fileProvider.generateFile()
      val exif: Bundle? = if (withExifData) readExif() else null

      val imageExporterHandler = object : Listener {
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
      }

      imageExporter.export(uri, outputFile, imageExporterHandler)
    } catch (e: IOException) {
      promise.reject(ImagePickerConstants.ERR_CAN_NOT_EXTRACT_METADATA, ImagePickerConstants.CAN_NOT_EXTRACT_METADATA_MESSAGE, e)
    }

    return null
  }

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
