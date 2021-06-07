package expo.modules.imagemanipulator

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Matrix
import android.net.Uri
import android.os.Bundle
import android.util.Base64
import expo.modules.imagemanipulator.arguments.Action
import expo.modules.imagemanipulator.arguments.ActionCrop
import expo.modules.imagemanipulator.arguments.ActionFlip
import expo.modules.imagemanipulator.arguments.ActionResize
import expo.modules.imagemanipulator.arguments.SaveOptions
import expo.modules.interfaces.imageloader.ImageLoaderInterface
import expo.modules.interfaces.imageloader.ImageLoaderInterface.ResultListener
import org.unimodules.core.ExportedModule
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.Promise
import org.unimodules.core.arguments.ReadableArguments
import org.unimodules.core.interfaces.ExpoMethod
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.util.*

class ImageManipulatorModule(context: Context?) : ExportedModule(context) {
  private var mImageLoader: ImageLoaderInterface? = null
  override fun getName(): String {
    return TAG
  }

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    mImageLoader = moduleRegistry.getModule(ImageLoaderInterface::class.java)
  }

  @ExpoMethod
  fun manipulateAsync(uri: String?, actions: ArrayList<Any?>, saveOptions: ReadableArguments?, promise: Promise) {
    if (uri == null || uri.length == 0) {
      promise.reject(ERROR_TAG + "_INVALID_ARG", "Uri passed to ImageManipulator cannot be empty!")
      return
    }
    val manipulatorSaveOptions: SaveOptions
    val manipulatorActions = ArrayList<Action>()
    try {
      manipulatorSaveOptions = SaveOptions.fromArguments(saveOptions)
      for (action in actions) {
        manipulatorActions.add(Action.fromObject(action))
      }
    } catch (e: IllegalArgumentException) {
      promise.reject(ERROR_TAG + "_INVALID_ARG", e)
      return
    }
    mImageLoader!!.loadImageForManipulationFromURL(uri, object : ResultListener {
      override fun onSuccess(bitmap: Bitmap) {
        processBitmapWithActions(bitmap, manipulatorActions, manipulatorSaveOptions, promise)
      }

      override fun onFailure(cause: Throwable?) {
        // No cleanup required here.
        val basicMessage = "Could not get decoded bitmap of $uri"
        if (cause != null) {
          promise.reject(ERROR_TAG + "_DECODE",
            "$basicMessage: $cause", cause)
        } else {
          promise.reject(ERROR_TAG + "_DECODE", "$basicMessage.")
        }
      }
    })
  }

  private fun resizeBitmap(bitmap: Bitmap, resize: ActionResize?): Bitmap {
    val imageRatio = bitmap.width.toFloat() / bitmap.height
    val requestedWidth = if (resize!!.width != 0) resize.width else if (resize.height != 0) (resize.height * imageRatio).toInt() else 0
    val requestedHeight = if (resize.height != 0) resize.height else if (resize.width != 0) (resize.width / imageRatio).toInt() else 0
    return Bitmap.createScaledBitmap(bitmap, requestedWidth, requestedHeight, true)
  }

  private fun rotateBitmap(bitmap: Bitmap, rotation: Int?): Bitmap {
    val rotationMatrix = Matrix()
    rotationMatrix.postRotate(rotation!!.toFloat())
    return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, rotationMatrix, true)
  }

  private fun flipBitmap(bmp: Bitmap, flip: ActionFlip?): Bitmap {
    return Bitmap.createBitmap(bmp, 0, 0, bmp.width, bmp.height, flip!!.rotationMatrix, true)
  }

  @Throws(IllegalArgumentException::class)
  private fun cropBitmap(bitmap: Bitmap, crop: ActionCrop?): Bitmap {
    require(!(crop!!.originX > bitmap.width || crop.originY > bitmap.height || crop.originX + crop.width > bitmap.width || crop.originY + crop.height > bitmap.height)) { "Invalid crop options has been passed. Please make sure the requested crop rectangle is inside source image." }
    return Bitmap.createBitmap(bitmap, crop.originX, crop.originY, crop.width, crop.height)
  }

  private fun processBitmapWithActions(bitmap: Bitmap, actions: ArrayList<Action>, saveOptions: SaveOptions, promise: Promise) {
    var bitmap = bitmap
    for (action in actions) {
      if (action.resize != null) {
        bitmap = resizeBitmap(bitmap, action.resize)
      } else if (action.rotate != null) {
        bitmap = rotateBitmap(bitmap, action.rotate)
      } else if (action.flip != null) {
        bitmap = flipBitmap(bitmap, action.flip)
      } else if (action.crop != null) {
        bitmap = try {
          cropBitmap(bitmap, action.crop)
        } catch (e: IllegalArgumentException) {
          promise.reject(ERROR_TAG + "_CROP_DATA", e)
          return
        }
      }
    }
    val compression = (saveOptions.compress * 100).toInt()
    var out: FileOutputStream? = null
    var byteOut: ByteArrayOutputStream? = null
    var path: String? = null
    var base64String: String? = null
    try {
      path = FileUtils.generateOutputPath(context.cacheDir, "ImageManipulator", saveOptions.format.fileExtension)
      out = FileOutputStream(path)
      bitmap.compress(saveOptions.format.compressFormat, compression, out)
      if (saveOptions.hasBase64()) {
        byteOut = ByteArrayOutputStream()
        bitmap.compress(saveOptions.format.compressFormat, compression, byteOut)
        base64String = Base64.encodeToString(byteOut.toByteArray(), Base64.NO_WRAP)
      }
    } catch (e: Exception) {
      e.printStackTrace()
    } finally {
      try {
        out?.close()
        byteOut?.close()
      } catch (e: IOException) {
        e.printStackTrace()
      }
    }
    val response = Bundle()
    response.putString("uri", Uri.fromFile(File(path)).toString())
    response.putInt("width", bitmap.width)
    response.putInt("height", bitmap.height)
    if (saveOptions.hasBase64()) {
      response.putString("base64", base64String)
    }
    promise.resolve(response)
  }

  companion object {
    private const val TAG = "ExpoImageManipulator"
    private const val ERROR_TAG = "E_IMAGE_MANIPULATOR"
  }
}
