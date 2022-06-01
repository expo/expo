package expo.modules.imagepicker.tasks

import android.content.ContentResolver
import android.net.Uri
import android.os.Bundle
import android.util.Base64
import androidx.exifinterface.media.ExifInterface
import expo.modules.imagepicker.ExifDataHandler
import expo.modules.imagepicker.FailedToExtractVideoMetadataException
import expo.modules.imagepicker.FailedToWriteFileException
import expo.modules.imagepicker.ImagePickerConstants.EXIF_TAGS
import expo.modules.imagepicker.ImagePickerMediaResponse
import expo.modules.imagepicker.UnknownException
import expo.modules.imagepicker.exporters.ImageExporter
import expo.modules.imagepicker.exporters.ImageExporter.Listener
import expo.modules.imagepicker.fileproviders.FileProvider
import expo.modules.kotlin.Promise
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.IOException
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

open class ImageResultTask(
  private val promise: Promise,
  private val uri: Uri,
  private val contentResolver: ContentResolver,
  private val fileProvider: FileProvider,
  private val isEdited: Boolean,
  private val withExifData: Boolean,
  private val imageExporter: ImageExporter,
  private var exifDataHandler: ExifDataHandler?,
  private val coroutineScope: CoroutineScope
) {
  /**
   * We need to make coroutine wait till the file is generated, while the underlying
   * thread is free to continue executing other coroutines.
   */
  private suspend fun getFile(): File = suspendCancellableCoroutine { cancellableContinuation ->
    try {
      val outputFile = fileProvider.generateFile()
      cancellableContinuation.resume(outputFile)
    } catch (e: Exception) {
      cancellableContinuation.resumeWithException(e)
    }
  }

  /**
   * We need to make coroutine wait till the exif data is being read, while the underlying
   * thread is free to continue executing other coroutines.
   */
  private suspend fun getExifData(): Bundle? = suspendCancellableCoroutine { cancellableContinuation ->
    try {
      val exif = if (withExifData) readExif() else null
      cancellableContinuation.resume(exif)
    } catch (e: Exception) {
      cancellableContinuation.resumeWithException(e)
    }
  }

  fun execute() {
    coroutineScope.launch {
      try {
        val outputFile = getFile()
        if (isEdited && withExifData) {
          exifDataHandler?.copyExifData(uri, contentResolver)
        }
        val exif = getExifData()
        val imageExporterHandler = object : Listener {
          override fun onResult(out: ByteArrayOutputStream?, width: Int, height: Int) {
            val response = ImagePickerMediaResponse.Image(
              uri = Uri.fromFile(outputFile).toString(),
              width = width,
              height = height,
              base64 = out?.let { Base64.encodeToString(it.toByteArray(), Base64.NO_WRAP) },
              exif = exif
            )
            promise.resolve(response)
          }

          override fun onFailure(cause: Throwable?) {
            promise.reject(FailedToWriteFileException(outputFile, cause))
          }
        }
        imageExporter.export(uri, outputFile, imageExporterHandler)
      } catch (e: IOException) {
        promise.reject(FailedToExtractVideoMetadataException(e))
      } catch (e: Exception) {
        promise.reject(UnknownException(e))
      }
    }
  }

  @Throws(IOException::class)
  private fun readExif() = Bundle().apply {
    contentResolver.openInputStream(uri)?.use { input ->
      val exifInterface = ExifInterface(input)
      EXIF_TAGS.forEach { (type, tag) ->
        if (exifInterface.getAttribute(tag) == null) {
          return@forEach
        }
        when (type) {
          "string" -> putString(tag, exifInterface.getAttribute(tag))
          "int" -> putInt(tag, exifInterface.getAttributeInt(tag, 0))
          "double" -> putDouble(tag, exifInterface.getAttributeDouble(tag, 0.0))
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
