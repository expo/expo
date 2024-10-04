package expo.modules.camera.tasks

import android.content.res.Resources
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import android.os.Bundle
import android.util.Base64
import androidx.exifinterface.media.ExifInterface
import expo.modules.camera.PictureOptions
import expo.modules.camera.legacy.CameraViewHelper.addExifData
import expo.modules.camera.legacy.CameraViewHelper.getExifData
import expo.modules.camera.legacy.CameraViewHelper.setExifData
import expo.modules.camera.legacy.utils.FileSystemUtils
import expo.modules.kotlin.Promise
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.io.IOException

private const val DIRECTORY_NOT_FOUND_MSG = "Documents directory of the app could not be found."
private const val UNKNOWN_IO_EXCEPTION_MSG = "An unknown I/O exception has occurred."
private const val UNKNOWN_EXCEPTION_MSG = "An unknown exception has occurred."
private const val PARAMETER_EXCEPTION_MSG = "An incompatible parameter has been passed in. "
private const val OUT_OF_MEMORY_EXCEPTION_MSG = "Cannot allocate enough space to process the taken picture."
private const val ERROR_TAG = "E_TAKING_PICTURE_FAILED"
private const val OUT_OF_MEMORY_TAG = "ERR_CAMERA_OUT_OF_MEMORY"
private const val DIRECTORY_NAME = "Camera"
private const val EXTENSION = ".jpg"
private const val BASE64_KEY = "base64"
private const val HEIGHT_KEY = "height"
private const val WIDTH_KEY = "width"
private const val EXIF_KEY = "exif"
private const val DATA_KEY = "data"
private const val URI_KEY = "uri"
private const val ID_KEY = "id"

fun getMirroredOrientation(orientation: Int): Int {
  return when (orientation) {
    ExifInterface.ORIENTATION_NORMAL -> ExifInterface.ORIENTATION_FLIP_HORIZONTAL
    ExifInterface.ORIENTATION_ROTATE_90 -> ExifInterface.ORIENTATION_TRANSPOSE
    ExifInterface.ORIENTATION_ROTATE_180 -> ExifInterface.ORIENTATION_FLIP_VERTICAL
    ExifInterface.ORIENTATION_ROTATE_270 -> ExifInterface.ORIENTATION_TRANSVERSE
    ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> ExifInterface.ORIENTATION_NORMAL
    ExifInterface.ORIENTATION_TRANSPOSE -> ExifInterface.ORIENTATION_ROTATE_90
    ExifInterface.ORIENTATION_FLIP_VERTICAL -> ExifInterface.ORIENTATION_ROTATE_180
    ExifInterface.ORIENTATION_TRANSVERSE -> ExifInterface.ORIENTATION_ROTATE_270
    else -> ExifInterface.ORIENTATION_UNDEFINED
  }
}

class ResolveTakenPicture(
  private var imageData: ByteArray,
  private var promise: Promise,
  private var options: PictureOptions,
  private var mirror: Boolean,
  private val directory: File,
  private var pictureSavedDelegate: PictureSavedDelegate
) {
  private val quality: Int
    get() = (options.quality * 100).toInt()

  suspend fun resolve() = withContext(Dispatchers.IO) {
    val bundle = processImage()
    onComplete(bundle)
  }

  private fun processImage(): Bundle? {
    // handle SkipProcessing
    if (options.skipProcessing) {
      return skipProcessing()
    }

    // set, read, and apply EXIF data
    try {
      ByteArrayInputStream(imageData).use { inputStream ->
        val response = Bundle()

        val exifInterface = ExifInterface(inputStream)

        // If there are additional exif data, insert it here
        options.additionalExif?.let {
          setExifData(exifInterface, it)
        }

        // Get orientation of the image from mImageData via inputStream
        val orientation = exifInterface.getAttributeInt(
          ExifInterface.TAG_ORIENTATION,
          ExifInterface.ORIENTATION_NORMAL
        )
        if (mirror) {
          exifInterface.setAttribute(ExifInterface.TAG_ORIENTATION, getMirroredOrientation(orientation).toString())
        }

        val bitmapOptions = BitmapFactory
          .Options()
          .apply {
            inSampleSize = 1
          }
        var bitmap: Bitmap? = null
        var lastError: Error? = null

        // If OOM exception was thrown, we try to use downsampling to recover.
        while (bitmapOptions.inSampleSize <= options.maxDownsampling) {
          try {
            bitmap = decodeBitmap(imageData, orientation, options, bitmapOptions)
            break
          } catch (exception: OutOfMemoryError) {
            bitmapOptions.inSampleSize *= 2
            lastError = exception
          }
        }

        if (bitmap == null) {
          promise.reject(OUT_OF_MEMORY_TAG, OUT_OF_MEMORY_EXCEPTION_MSG, lastError)
          return null
        }

        // Write Exif data to the response if requested
        if (options.exif) {
          val exifData = getExifData(exifInterface)
          response.putBundle(EXIF_KEY, exifData)
        }

        // Upon rotating, write the image's dimensions to the response
        response.apply {
          putInt(WIDTH_KEY, bitmap.width)
          putInt(HEIGHT_KEY, bitmap.height)
        }

        // Cache compressed image in imageStream
        ByteArrayOutputStream().use { imageStream ->
          bitmap.compress(Bitmap.CompressFormat.JPEG, quality, imageStream)
          // Write compressed image to file in cache directory
          val filePath = writeStreamToFile(imageStream)
          bitmap.recycle()
          // Save Exif data to the image if requested
          if (options.exif) {
            val exifFromFile = ExifInterface(filePath!!)
            addExifData(exifFromFile, exifInterface)
          }
          val imageFile = File(filePath)
          val fileUri = Uri.fromFile(imageFile).toString()
          response.putString(URI_KEY, fileUri)

          // Write base64-encoded image to the response if requested
          if (options.base64) {
            response.putString(BASE64_KEY, Base64.encodeToString(imageStream.toByteArray(), Base64.NO_WRAP))
          }
        }
        return response
      }
    } catch (e: Exception) {
      when (e) {
        is Resources.NotFoundException -> promise.reject(ERROR_TAG, DIRECTORY_NOT_FOUND_MSG, e)
        is IOException -> promise.reject(ERROR_TAG, UNKNOWN_IO_EXCEPTION_MSG, e)
        is IllegalArgumentException -> promise.reject(ERROR_TAG, PARAMETER_EXCEPTION_MSG, e)
        else -> promise.reject(ERROR_TAG, UNKNOWN_EXCEPTION_MSG, e)
      }
      e.printStackTrace()
    }
    // An exception had to occur, promise has already been rejected. Do not try to resolve it again.
    return null
  }

  private fun skipProcessing(): Bundle? {
    try {
      // save byte array (it's already a JPEG)
      ByteArrayOutputStream().use { imageStream ->
        imageStream.write(imageData)

        // write compressed image to file in cache directory
        val filePath = writeStreamToFile(imageStream)
        val imageFile = filePath?.let { File(it) }

        // handle image uri
        val fileUri = Uri.fromFile(imageFile).toString()

        // read exif information
        val exifInterface = ExifInterface(filePath!!)

        return Bundle().apply {
          putString(URI_KEY, fileUri)
          putInt(WIDTH_KEY, exifInterface.getAttributeInt(ExifInterface.TAG_IMAGE_WIDTH, -1))
          putInt(HEIGHT_KEY, exifInterface.getAttributeInt(ExifInterface.TAG_IMAGE_LENGTH, -1))
          // handle exif request
          if (options.exif) {
            val exifData = getExifData(exifInterface)
            putBundle(EXIF_KEY, exifData)
          }
          // handle base64
          if (options.base64) {
            putString(BASE64_KEY, Base64.encodeToString(imageData, Base64.NO_WRAP))
          }
        }
      }
    } catch (e: IOException) {
      promise.reject(ERROR_TAG, UNKNOWN_IO_EXCEPTION_MSG, e)
      e.printStackTrace()
    } catch (e: Exception) {
      promise.reject(ERROR_TAG, UNKNOWN_EXCEPTION_MSG, e)
      e.printStackTrace()
    }
    // error occurred
    return null
  }

  private fun onComplete(response: Bundle?) {
    if (response == null) {
      return
    }

    if (options.fastMode) {
      val wrapper = Bundle()
      wrapper.putInt(ID_KEY, requireNotNull(options.id))
      wrapper.putBundle(DATA_KEY, response)
      pictureSavedDelegate.onPictureSaved(wrapper)
    } else {
      promise.resolve(response)
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

  private fun decodeBitmap(imageData: ByteArray, orientation: Int, options: PictureOptions, bitmapOptions: BitmapFactory.Options): Bitmap {
    // Rotate the bitmap to the proper orientation if needed
    return if (!options.exif) {
      decodeAndRotateBitmap(imageData, getImageRotation(orientation), bitmapOptions)
    } else {
      BitmapFactory.decodeByteArray(imageData, 0, imageData.size, bitmapOptions)
    }
  }

  private fun decodeAndRotateBitmap(imageData: ByteArray, angle: Int, options: BitmapFactory.Options): Bitmap {
    val source = BitmapFactory.decodeByteArray(imageData, 0, imageData.size, options)
    val matrix = Matrix()
    matrix.apply {
      postRotate(angle.toFloat())
      if (mirror) {
        postScale(-1f, 1f)
      }
    }
    return Bitmap.createBitmap(source, 0, 0, source.width, source.height, matrix, true)
  }

  // Get rotation degrees from Exif orientation enum
  private fun getImageRotation(orientation: Int) = when (orientation) {
    ExifInterface.ORIENTATION_ROTATE_90 -> 90
    ExifInterface.ORIENTATION_TRANSPOSE -> 90
    ExifInterface.ORIENTATION_ROTATE_180 -> 180
    ExifInterface.ORIENTATION_FLIP_VERTICAL -> 180
    ExifInterface.ORIENTATION_ROTATE_270 -> 270
    ExifInterface.ORIENTATION_TRANSVERSE -> 270
    else -> 0
  }
}
