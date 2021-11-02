package expo.modules.camera.tasks

import android.content.res.Resources
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import android.os.AsyncTask
import android.os.Bundle
import android.util.Base64
import androidx.exifinterface.media.ExifInterface

import expo.modules.camera.CameraViewHelper.getExifData
import expo.modules.camera.CameraViewHelper.addExifData
import expo.modules.camera.utils.FileSystemUtils
import expo.modules.core.Promise

import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.lang.Exception

private const val DIRECTORY_NOT_FOUND_MSG = "Documents directory of the app could not be found."
private const val UNKNOWN_IO_EXCEPTION_MSG = "An unknown I/O exception has occurred."
private const val UNKNOWN_EXCEPTION_MSG = "An unknown exception has occurred."
private const val ERROR_TAG = "E_TAKING_PICTURE_FAILED"
private const val DIRECTORY_NAME = "Camera"
private const val EXTENSION = ".jpg"
private const val SKIP_PROCESSING_KEY = "skipProcessing"
private const val FAST_MODE_KEY = "fastMode"
private const val QUALITY_KEY = "quality"
private const val BASE64_KEY = "base64"
private const val HEIGHT_KEY = "height"
private const val WIDTH_KEY = "width"
private const val EXIF_KEY = "exif"
private const val DATA_KEY = "data"
private const val URI_KEY = "uri"
private const val ID_KEY = "id"
private const val DEFAULT_QUALITY = 1

class ResolveTakenPictureAsyncTask(
  private var promise: Promise,
  private var options: Map<String, Any>,
  private val directory: File,
  private var pictureSavedDelegate: PictureSavedDelegate
) : AsyncTask<Void?, Void?, Bundle?>() {
  private var imageData: ByteArray? = null
  private var bitmap: Bitmap? = null

  constructor(imageData: ByteArray?, promise: Promise, options: Map<String, Any>, directory: File, delegate: PictureSavedDelegate) : this(
    promise, options, directory, delegate
  ) {
    this.imageData = imageData
  }

  constructor(bitmap: Bitmap?, promise: Promise, options: Map<String, Any>, directory: File, delegate: PictureSavedDelegate) : this(
    promise, options, directory, delegate
  ) {
    this.bitmap = bitmap
  }

  private val quality: Int
    get() = options[QUALITY_KEY]?.let {
      val requestedQuality = (it as Number).toDouble()
      (requestedQuality * 100).toInt()
    } ?: DEFAULT_QUALITY * 100

  override fun doInBackground(vararg params: Void?): Bundle? {
    // handle SkipProcessing
    if (imageData != null && isOptionEnabled(SKIP_PROCESSING_KEY)) {
      return handleSkipProcessing()
    }
    if (bitmap == null) {
      bitmap = imageData?.let { BitmapFactory.decodeByteArray(imageData, 0, it.size) }
    }
    try {
      ByteArrayInputStream(imageData).use { inputStream ->
        val response = Bundle()

        val exifInterface = ExifInterface(inputStream)
        // Get orientation of the image from mImageData via inputStream
        val orientation = exifInterface.getAttributeInt(
          ExifInterface.TAG_ORIENTATION,
          ExifInterface.ORIENTATION_UNDEFINED
        )

        // Rotate the bitmap to the proper orientation if needed
        if (orientation != ExifInterface.ORIENTATION_UNDEFINED) {
          bitmap = bitmap?.let {
            rotateBitmap(it, getImageRotation(orientation))
          }
        }

        // Write Exif data to the response if requested
        if (isOptionEnabled(EXIF_KEY)) {
          val exifData = getExifData(exifInterface)
          response.putBundle(EXIF_KEY, exifData)
        }

        // Upon rotating, write the image's dimensions to the response
        response.apply {
          putInt(WIDTH_KEY, bitmap!!.width)
          putInt(HEIGHT_KEY, bitmap!!.height)
        }

        // Cache compressed image in imageStream
        ByteArrayOutputStream().use { imageStream ->
          bitmap!!.compress(Bitmap.CompressFormat.JPEG, quality, imageStream)
          // Write compressed image to file in cache directory
          val filePath = writeStreamToFile(imageStream)

          // Save Exif data to the image if requested
          if (isOptionEnabled(EXIF_KEY)) {
            val exifFromFile = ExifInterface(filePath!!)
            addExifData(exifFromFile, exifInterface)
          }
          val imageFile = File(filePath)
          val fileUri = Uri.fromFile(imageFile).toString()
          response.putString(URI_KEY, fileUri)

          // Write base64-encoded image to the response if requested
          if (isOptionEnabled(BASE64_KEY)) {
            response.putString(BASE64_KEY, Base64.encodeToString(imageStream.toByteArray(), Base64.NO_WRAP))
          }
        }
        return response
      }
    } catch (e: Exception) {
      when (e) {
        is Resources.NotFoundException -> promise.reject(ERROR_TAG, DIRECTORY_NOT_FOUND_MSG, e)
        is IOException -> promise.reject(ERROR_TAG, UNKNOWN_IO_EXCEPTION_MSG, e)
        else -> promise.reject(ERROR_TAG, UNKNOWN_EXCEPTION_MSG, e)
      }
      e.printStackTrace()
    }
    // An exception had to occur, promise has already been rejected. Do not try to resolve it again.
    return null
  }

  private fun handleSkipProcessing(): Bundle? {
    try {
      // save byte array (it's already a JPEG)
      ByteArrayOutputStream().use { imageStream ->
        imageStream.write(imageData)

        // write compressed image to file in cache directory
        val filePath = writeStreamToFile(imageStream)
        val imageFile = File(filePath)

        // handle image uri
        val fileUri = Uri.fromFile(imageFile).toString()

        // read exif information
        val exifInterface = ExifInterface(filePath!!)

        return Bundle().apply {
          putString(URI_KEY, fileUri)
          putInt(WIDTH_KEY, exifInterface.getAttributeInt(ExifInterface.TAG_IMAGE_WIDTH, -1))
          putInt(HEIGHT_KEY, exifInterface.getAttributeInt(ExifInterface.TAG_IMAGE_LENGTH, -1))
          // handle exif request
          if (isOptionEnabled(EXIF_KEY)) {
            val exifData = getExifData(exifInterface)
            putBundle(EXIF_KEY, exifData)
          }
          // handle base64
          if (isOptionEnabled(BASE64_KEY)) {
            putString(BASE64_KEY, Base64.encodeToString(imageData, Base64.NO_WRAP))
          }
        }
      }
    } catch (e: Exception) {
      if (e is IOException) {
        promise.reject(ERROR_TAG, UNKNOWN_IO_EXCEPTION_MSG, e)
      } else {
        promise.reject(ERROR_TAG, UNKNOWN_EXCEPTION_MSG, e)
      }
      e.printStackTrace()
    }
    // error occurred
    return null
  }

  override fun onPostExecute(response: Bundle?) {
    super.onPostExecute(response)

    // If the response is not null everything went well and we can resolve the promise.
    if (response != null) {
      if (isOptionEnabled(FAST_MODE_KEY)) {
        val wrapper = Bundle()
        wrapper.putInt(ID_KEY, (options[ID_KEY] as Double).toInt())
        wrapper.putBundle(DATA_KEY, response)
        pictureSavedDelegate.onPictureSaved(wrapper)
      } else {
        promise.resolve(response)
      }
    }
  }

  // Write stream to file in cache directory
  @Throws(Exception::class)
  private fun writeStreamToFile(inputStream: ByteArrayOutputStream): String? {
    try {
      val outputPath = FileSystemUtils.generateOutputPath(directory, DIRECTORY_NAME, EXTENSION)
      FileOutputStream(outputPath).use { outputStream ->
        inputStream.writeTo(outputStream)
      }
      return outputPath
    } catch (e: IOException) {
      e.printStackTrace()
    }
    return null
  }

  private fun rotateBitmap(source: Bitmap, angle: Int): Bitmap {
    val matrix = Matrix()
    matrix.postRotate(angle.toFloat())
    return Bitmap.createBitmap(source, 0, 0, source.width, source.height, matrix, true)
  }

  // Get rotation degrees from Exif orientation enum
  private fun getImageRotation(orientation: Int) = when (orientation) {
    ExifInterface.ORIENTATION_ROTATE_90 -> 90
    ExifInterface.ORIENTATION_ROTATE_180 -> 180
    ExifInterface.ORIENTATION_ROTATE_270 -> 270
    else -> 0
  }

  private fun isOptionEnabled(key: String) = options[key] != null && (options[key] as Boolean)
}
